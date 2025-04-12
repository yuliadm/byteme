import os
import logging
import sys
from dotenv import load_dotenv
import asyncio  # For running sync code in async endpoint
import json
import threading
from queue import Queue

# Intialize Langtrace
# Must precede any llm module imports

from langtrace_python_sdk import langtrace

langtrace.init(
    api_key="503673573713bee42d7940dc2db7209381305ef1f0c1f186197efa596e337108"
)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Tuple, Optional

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.tasks.task_output import TaskOutput


# LlamaIndex imports
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
    Settings,
)
from llama_index.core.chat_engine import CondenseQuestionChatEngine
from llama_index.llms.openai import OpenAI  # Or your preferred LLM

# Import our new LangChain chat router
from langchain_chat import router as langchain_router

# --- Basic Setup & Configuration ---
# Load environment variables from .env file (especially OPENAI_API_KEY)
load_dotenv()

# Setup logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler(stream=sys.stdout))


# Check for OpenAI API Key
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("Error: OPENAI_API_KEY environment variable not set.")
    sys.exit(1)


# Configure LlamaIndex settings (optional, defaults are often fine)
# Example: Use GPT-4 Turbo if available, otherwise default
# try:
#     Settings.llm = OpenAI(model="gpt-4-turbo", temperature=0.1)
# except Exception:
#     print("GPT-4 Turbo not available, using default OpenAI model.")
#     Settings.llm = OpenAI(temperature=0.1) # Uses default model like gpt-3.5-turbo
# Settings.chunk_size = 512 # Example setting
print(api_key)

# --- Constants ---
PDF_DIR = "data"  # Directory containing your PDF(s)
PERSIST_DIR = "./storage"  # Directory to store the index

# --- Create a global message queue for streaming ---
message_queue = Queue()

# --- LlamaIndex: Load or Build Index ---
index = None
try:
    # Check if the storage directory exists
    storage_exists = os.path.exists(PERSIST_DIR)

    if storage_exists:
        try:
            # Attempt to load the existing index
            print(f"Loading existing index from '{PERSIST_DIR}'...")
            storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
            index = load_index_from_storage(storage_context)
            print("Index loaded successfully.")
        except FileNotFoundError:
            print(
                f"Warning: Storage directory '{PERSIST_DIR}' found, but essential index files (like docstore.json) are missing."
            )
            print("Rebuilding index...")
            storage_exists = (
                False  # Treat as if storage doesn't exist to trigger rebuild
            )
        except Exception as e:
            print(
                f"Error loading index from '{PERSIST_DIR}': {e}. Attempting to rebuild."
            )
            logging.warning(f"Failed to load existing index, rebuilding: {e}")
            storage_exists = (
                False  # Treat as if storage doesn't exist to trigger rebuild
            )

    if not storage_exists:
        print(
            f"Index storage directory '{PERSIST_DIR}' not found or incomplete. Building new index..."
        )
        if not os.path.exists(PDF_DIR) or not os.listdir(PDF_DIR):
            print(f"Error: PDF directory '{PDF_DIR}' is empty or does not exist.")
            sys.exit(1)

        # Load the documents and create the index
        print(f"Loading documents from '{PDF_DIR}'...")
        documents = SimpleDirectoryReader(PDF_DIR).load_data()
        if not documents:
            print(f"Error: No documents loaded from '{PDF_DIR}'. Check PDF files.")
            sys.exit(1)
        print(f"Loaded {len(documents)} document sections.")

        print("Building index...")
        index = VectorStoreIndex.from_documents(documents)

        # Store it for later use
        print(f"Persisting index to '{PERSIST_DIR}'...")
        # Ensure the directory exists before persisting
        os.makedirs(PERSIST_DIR, exist_ok=True)
        index.storage_context.persist(persist_dir=PERSIST_DIR)
        print(f"Index built and saved successfully.")

except Exception as e:
    print(f"Fatal Error during index setup: {e}")
    logging.exception("Index loading/building failed:")
    sys.exit(1)

# --- Ensure index is valid after setup ---
if index is None:
    print("Fatal Error: Index could not be loaded or built. Exiting.")
    sys.exit(1)


# --- LlamaIndex: Create Chat Engine ---
# Using CondenseQuestionChatEngine to maintain conversation context
# For stateless behavior per request, you might need to manage history explicitly
chat_engine = index.as_chat_engine(
    chat_mode="condense_question",
    verbose=True,
    # You can customize system prompts, memory buffers etc. here
    # system_prompt="You are a helpful assistant knowledgeable about the provided document."
)
print("Chat engine created.")


# --- Helper Function to Load Document Content ---
# This can be reused by LlamaIndex (implicitly) and CrewAI (explicitly)
def load_all_document_text(directory: str) -> str:
    """Loads and concatenates text content from all PDFs in a directory."""
    all_text = ""
    if not os.path.exists(directory) or not os.listdir(directory):
        print(f"Warning: Document directory '{directory}' is empty or missing.")
        return ""
    try:
        reader = SimpleDirectoryReader(directory)
        documents = reader.load_data()
        for doc in documents:
            all_text += doc.get_content() + "\n\n---\n\n"  # Add separator
        print(
            f"Loaded text from {len(documents)} documents in '{directory}'. Total length: {len(all_text)}"
        )
        return all_text
    except Exception as e:
        print(f"Error loading documents from {directory}: {e}")
        logging.exception("Document loading failed:")
        return ""


# --- CrewAI Summarization Logic with Streaming ---
def run_esg_summary_crew_with_streaming(document_texts: str) -> str:
    """Defines and runs the CrewAI agents to summarize ESG documents with streaming updates."""
    if not document_texts:
        return "Error: No document content provided to summarize."

    # Define custom callbacks for agents
    def agent_thinking_callback(agent, thought):
        message_queue.put(
            {
                "status": "thinking",
                "agent": "ESG Agent",
                "thought": "ESG Agent finished...",
            }
        )

    def task_output_callback(output: TaskOutput):
        message_queue.put(
            {
                "status": "thinking",
                "agent": "ESG Task",
                "thought": "ESG Task finished...",
            }
        )

    # Define Agents with callbacks
    esg_analyst = Agent(
        role="ESG Document Analyst",
        goal="Analyze the provided ESG document texts to identify key themes, risks, opportunities, and metrics reported.",
        backstory="""You are an expert ESG analyst with a keen eye for detail.
        You meticulously read through corporate sustainability and ESG reports
        to extract the most critical information relevant to environmental, social,
        and governance performance.""",
        verbose=True,
        allow_delegation=False,
        # Add the callbacks
        callback=task_output_callback,
    )

    summary_writer = Agent(
        role="Executive Summary Writer",
        goal="Synthesize the analysis from the ESG Analyst into a concise, easy-to-understand executive summary.",
        backstory="""You are a skilled writer specializing in creating high-level executive summaries
        for busy stakeholders. You take complex information and distill it into clear,
        actionable insights, focusing on the most important takeaways.""",
        verbose=True,
        allow_delegation=False,
        # Add the callbacks
        callback=task_output_callback,
    )

    # Define Tasks with callbacks
    analysis_task = Task(
        description=(
            "Review the following ESG document text: \n\n---\n{docs}\n---\n\n"
            "Identify and list the key environmental initiatives, social responsibility programs, "
            "governance structures, major risks mentioned, key opportunities highlighted, "
            "and any significant quantitative metrics reported (e.g., CO2 emissions, diversity ratios)."
            "Provide a structured analysis."
        ).format(
            docs=document_texts[:10000]
        ),  # Pass document text, potentially truncated if too long for context window
        expected_output="A structured report detailing key ESG themes, risks, opportunities, and metrics found in the text.",
        agent=esg_analyst,
        # Add the callbacks
        callback=task_output_callback,
    )

    summary_task = Task(
        description=(
            "Based on the ESG Analyst's report, write a concise executive summary (2-3 paragraphs). "
            "The summary should highlight the company's main ESG strengths, weaknesses/risks, "
            "and key performance indicators mentioned. Make it suitable for a board-level overview."
        ),
        expected_output="A well-structured executive summary of the ESG findings, approximately 2-3 paragraphs long.",
        agent=summary_writer,
        context=[analysis_task],  # Depends on the output of the analysis task
        # Add the callbacks
        callback=task_output_callback,
    )

    # Create and Run Crew
    esg_crew = Crew(
        agents=[esg_analyst, summary_writer],
        tasks=[analysis_task, summary_task],
        process=Process.sequential,  # Tasks run one after another
        verbose=True,  # Enable verbose mode
    )

    print("Kicking off ESG Summary Crew with streaming updates...")
    message_queue.put(
        {"status": "starting", "message": "Starting ESG analysis with CrewAI agents..."}
    )
    result = esg_crew.kickoff()
    print("Crew finished.")

    # Extract the string result from CrewOutput object
    if hasattr(result, "raw"):
        return result.raw  # Most recent versions use .raw attribute
    elif hasattr(result, "output"):
        return result.output  # Some versions use .output attribute
    elif hasattr(result, "final_output"):
        return result.final_output  # Some versions use .final_output attribute
    else:
        # If none of the expected attributes exist, convert to string as fallback
        return str(result)


# --- Original CrewAI Summarization Logic (keep for /api/summarize_esg endpoint) ---
def run_esg_summary_crew(document_texts: str) -> str:
    """Defines and runs the CrewAI agents to summarize ESG documents."""
    if not document_texts:
        return "Error: No document content provided to summarize."

    # Define Agents
    esg_analyst = Agent(
        role="ESG Document Analyst",
        goal="Analyze the provided ESG document texts to identify key themes, risks, opportunities, and metrics reported.",
        backstory="""You are an expert ESG analyst with a keen eye for detail.
        You meticulously read through corporate sustainability and ESG reports
        to extract the most critical information relevant to environmental, social,
        and governance performance.""",
        verbose=True,
        allow_delegation=False,
        # llm=OpenAI(temperature=0.1) # Optional: configure LLM per agent
    )

    summary_writer = Agent(
        role="Executive Summary Writer",
        goal="Synthesize the analysis from the ESG Analyst into a concise, easy-to-understand executive summary.",
        backstory="""You are a skilled writer specializing in creating high-level executive summaries
        for busy stakeholders. You take complex information and distill it into clear,
        actionable insights, focusing on the most important takeaways.""",
        verbose=True,
        allow_delegation=False,
    )

    # Define Tasks
    analysis_task = Task(
        description=(
            "Review the following ESG document text: \n\n---\n{docs}\n---\n\n"
            "Identify and list the key environmental initiatives, social responsibility programs, "
            "governance structures, major risks mentioned, key opportunities highlighted, "
            "and any significant quantitative metrics reported (e.g., CO2 emissions, diversity ratios)."
            "Provide a structured analysis."
        ).format(
            docs=document_texts[:10000]
        ),  # Pass document text, potentially truncated if too long for context window
        expected_output="A structured report detailing key ESG themes, risks, opportunities, and metrics found in the text.",
        agent=esg_analyst,
    )

    summary_task = Task(
        description=(
            "Based on the ESG Analyst's report, write a concise executive summary (2-3 paragraphs). "
            "The summary should highlight the company's main ESG strengths, weaknesses/risks, "
            "and key performance indicators mentioned. Make it suitable for a board-level overview."
        ),
        expected_output="A well-structured executive summary of the ESG findings, approximately 2-3 paragraphs long.",
        agent=summary_writer,
        context=[analysis_task],  # Depends on the output of the analysis task
    )

    # Create and Run Crew
    esg_crew = Crew(
        agents=[esg_analyst, summary_writer],
        tasks=[analysis_task, summary_task],
        process=Process.sequential,  # Tasks run one after another
        verbose=True,  # Enable verbose mode
    )

    print("Kicking off ESG Summary Crew...")
    result = esg_crew.kickoff()
    print("Crew finished.")
    # Extract the string result from CrewOutput object
    if hasattr(result, "raw"):
        return result.raw  # Most recent versions use .raw attribute
    elif hasattr(result, "output"):
        return result.output  # Some versions use .output attribute
    elif hasattr(result, "final_output"):
        return result.final_output  # Some versions use .final_output attribute
    else:
        # If none of the expected attributes exist, convert to string as fallback
        return str(result)


# --- FastAPI App Setup ---
app = FastAPI(
    title="LlamaIndex RAG Chat API",
    description="API to chat with a document using LlamaIndex and FastAPI.",
    version="1.0.0",
)

# Include the LangChain chat router
app.include_router(langchain_router)

# CORS Middleware: Allows requests from your Next.js frontend (and other origins)
# IMPORTANT: Adjust origins for production deployment
origins = [
    "http://localhost:3000",  # Allow Next.js dev server
    "https://v0.dev",
    "https://vusercontent.net",  # Allow vercel v0.dev domain
    "https://v0.dev/chat/fork-of-raiffeisen-real-estate-8FgA0F6SBS0",
    "https://kzsmlp7lalhelly7stmwv.usercontent.net",  # Allow specific chat path
    # "https://your-deployed-frontend.com", # Add your production frontend URL
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# --- API Request/Response Models (using Pydantic) ---
class ChatRequest(BaseModel):
    message: str
    # Optional: Pass chat history from client if managing state there
    # chat_history: Optional[List[Tuple[str, str]]] = None # Example: [("user", "hi"), ("assistant", "hello")]


class ChatResponse(BaseModel):
    response: str
    # Optional: Return updated history if needed
    # chat_history: Optional[List[Tuple[str, str]]] = None


class SummaryResponse(BaseModel):
    summary: str


# --- API Endpoints ---
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Receives a chat message, processes it with the LlamaIndex chat engine,
    and returns the AI's response.
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    print(f"Received message: {request.message}")

    # Convert chat history format if needed (example assumes simple list of tuples)
    # llama_index_history = []
    # if request.chat_history:
    #     for role, content in request.chat_history:
    #         llama_index_history.append(ChatMessage(role=MessageRole.USER if role == "user" else MessageRole.ASSISTANT, content=content))

    try:
        # Process the message using the chat engine
        # The CondenseQuestionChatEngine handles history internally by default
        # For async streaming response:
        # streaming_response = await chat_engine.astream_chat(request.message)
        # async def event_generator():
        #     async for token in streaming_response.async_response_gen():
        #         yield f"data: {json.dumps({'token': token})}\n\n"
        # return StreamingResponse(event_generator(), media_type="text/event-stream")

        # For simple non-streaming response:
        response = await chat_engine.achat(request.message)  # Use achat for async call

        if not response or not response.response:
            raise HTTPException(
                status_code=500, detail="Received empty response from chat engine."
            )

        print(f"Sending response: {response.response}")
        return ChatResponse(response=response.response)

    except Exception as e:
        logging.exception("Error processing chat request:")  # Log the full traceback
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


# --- Streaming Endpoints ---
@app.get("/api/stream_summary")
async def stream_summary():
    """Stream the ESG summarization process in real-time."""

    async def event_generator():
        while True:
            # Check if there are new messages in the queue
            if not message_queue.empty():
                msg = message_queue.get()
                if msg == "DONE":
                    yield f"data: {json.dumps({'status': 'complete'})}\n\n"
                    break
                yield f"data: {json.dumps(msg)}\n\n"
            await asyncio.sleep(0.1)  # Small delay to avoid CPU spinning

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/summarize_esg_stream")
async def summarize_esg_stream_endpoint():
    """Endpoint to trigger ESG document summarization with streaming results."""
    print("Received request to stream ESG document summarization...")
    try:
        # Load document text
        document_text = load_all_document_text(PDF_DIR)
        if not document_text:
            raise HTTPException(
                status_code=404,
                detail=f"No documents found or loaded from '{PDF_DIR}'.",
            )

        # Clear any previous messages
        while not message_queue.empty():
            message_queue.get()

        # Start the crew in a background thread
        def run_crew_background():
            try:
                result = run_esg_summary_crew_with_streaming(document_text)
                print(f"Background crew completed with result length: {len(result)}")
                message_queue.put(
                    {"status": "finished", "message": "Analysis complete!"}
                )
                message_queue.put("DONE")  # Signal the end of the stream
            except Exception as e:
                print(f"Error in background crew: {e}")
                message_queue.put({"status": "error", "message": str(e)})
                message_queue.put("DONE")

        # Start the thread
        thread = threading.Thread(target=run_crew_background)
        thread.daemon = True  # Thread will exit when main thread exits
        thread.start()

        return {
            "status": "started",
            "message": "ESG analysis started. Connect to /api/stream_summary for updates.",
        }

    except Exception as e:
        logging.exception("Error processing streaming ESG summarization request:")
        if isinstance(e, HTTPException):
            raise e
        else:
            raise HTTPException(
                status_code=500, detail=f"Streaming Summarization Error: {str(e)}"
            )


@app.get("/api/summarize_esg", response_model=SummaryResponse)
async def summarize_esg_endpoint():
    """Endpoint to trigger ESG document summarization using CrewAI."""
    print("Received request to summarize ESG documents...")
    try:
        # Load document text (could be cached in a real app)
        document_text = load_all_document_text(PDF_DIR)
        if not document_text:
            raise HTTPException(
                status_code=404,
                detail=f"No documents found or loaded from '{PDF_DIR}'.",
            )

        # Run the synchronous CrewAI task in a thread pool to avoid blocking FastAPI
        loop = asyncio.get_running_loop()
        summary_result = await loop.run_in_executor(
            None,  # Use default executor (ThreadPoolExecutor)
            run_esg_summary_crew,  # The function to run
            document_text,  # Arguments to the function
        )

        if isinstance(summary_result, str) and "Error:" in summary_result:
            # Basic check if the crew function returned an error string
            raise HTTPException(
                status_code=500, detail=f"Summarization failed: {summary_result}"
            )

        # No need to check length - we've already converted to string in run_esg_summary_crew
        print(f"Sending summary result.")
        return SummaryResponse(summary=summary_result)

    except Exception as e:
        logging.exception("Error processing ESG summarization request:")
        # Check if it's an HTTPException we raised ourselves
        if isinstance(e, HTTPException):
            raise e
        else:
            raise HTTPException(
                status_code=500, detail=f"Summarization Error: {str(e)}"
            )


@app.get("/api/health", summary="Health Check")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}


# --- Optional: Reset Chat History Endpoint ---
@app.post("/api/reset", summary="Reset Chat History")
async def reset_chat():
    """Resets the chat engine's conversation history."""
    try:
        chat_engine.reset()
        print("Chat history reset.")
        return {"message": "Chat history reset successfully"}
    except Exception as e:
        logging.exception("Error resetting chat history:")
        raise HTTPException(
            status_code=500, detail=f"Could not reset chat history: {str(e)}"
        )


# --- Run the app (for local development) ---
# To run: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn

    print("Starting FastAPI server on http://localhost:8000")
    # Use host="0.0.0.0" to make it accessible on your network
    uvicorn.run(app, host="0.0.0.0", port=8000)
