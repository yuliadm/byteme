from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage
import os
from collections import defaultdict
from langchain import hub


from tavily import TavilyClient

# Get API key from environment variable
# tavily_api_key = os.environ.get("TAVILY_API_KEY")
tavily_api_key = "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"
from langchain_community.tools.tavily_search import TavilySearchResults


# Check if the API key exists
if not tavily_api_key:
    raise ValueError("TAVILY_API_KEY environment variable is not set")

tavily_client = TavilyClient(api_key=tavily_api_key)

tavily_search_tool = TavilySearchResults()

agent_tools = [tavily_search_tool]

router = APIRouter()

from langchain_openai import ChatOpenAI

MODEL = "gpt-4o-mini"
llm = ChatOpenAI(model=MODEL, temperature=0)

# Get the prompt to use - you can modify this!
prompt = hub.pull("hwchase17/openai-tools-agent")

from langchain.agents import create_tool_calling_agent

agent = create_tool_calling_agent(llm, agent_tools, prompt)

from langchain.agents import AgentExecutor

agent_executor = AgentExecutor(agent=agent, tools=agent_tools, verbose=True)


# Store conversations in memory (in production, use a database)
conversations = defaultdict(lambda: ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
))

# Initialize the LLM
llm = ChatOpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    model_name=MODEL,
    temperature=0.7,
)

# Create the chat prompt template with history
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful, friendly AI assistant for real estate. You help users find their dream properties and provide information about the real estate market."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None

@router.post("/api/openapichat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint for LangChain-based chat using OpenAI with conversation memory and agent tools.
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        # Get or create memory for this session
        session_id = request.session_id or "default"
        memory = conversations[session_id]

        # Process the message using the agent executor
        response = await agent_executor.ainvoke({
            "input": request.message,
            "chat_history": memory.chat_memory.messages
        })
        
        # Save the conversation to memory
        memory.save_context(
            {"input": request.message},
            {"output": response["output"]}
        )
        
        return ChatResponse(
            response=response["output"],
            session_id=session_id
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  # Add logging
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred processing your request: {str(e)}"
        ) 
