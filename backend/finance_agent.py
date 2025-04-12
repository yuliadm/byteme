import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from collections import defaultdict

# LangChain components
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage
from langchain import hub  # Hub for prompt templates
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_community.tools.tavily_search import TavilySearchResults

# Tavily client for search tool
from tavily import TavilyClient

# --- Configuration ---

# Get API keys from environment variables
TAVILY_API_KEY = os.environ.get(
    "TAVILY_API_KEY"
)  # Replace with your key if not using env vars
OPENAI_API_KEY = os.environ.get(
    "OPENAI_API_KEY"
)  # Replace with your key if not using env vars

if not TAVILY_API_KEY:
    raise ValueError("TAVILY_API_KEY environment variable is not set")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

MODEL = "gpt-4o-mini"  # Or another preferred model

# --- Tool Setup ---

# Initialize Tavily Search Tool
tavily_search_tool = TavilySearchResults(max_results=2)
agent_tools = [tavily_search_tool]  # List of tools the agent can use

# --- LLM and Agent Setup ---

# Initialize the LLM
llm = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,
    model_name=MODEL,
    temperature=0.5,  # Slightly lower temp for more focused responses
)

# --- System Prompt for Mortgage Focus ---
SYSTEM_MESSAGE = """You are a helpful AI assistant accessed via a finance agent endpoint, specializing in preliminary mortgage advice.
Your primary goal is to understand a user's financial situation before providing guidance.

**Your Interaction Flow:**

1.  **Greeting & Purpose:** Start by introducing yourself and explaining you can help with preliminary mortgage questions.
2.  **Information Gathering (CRUCIAL):**
    * If the user expresses interest in mortgages, buying a house, or affordability:
    * You **MUST** first ask for and collect their **approximate annual household income**. Wait for their answer.
    * After getting the income, you **MUST** then ask for their **approximate average monthly savings amount**.
    * Use clear, friendly questions like: "To get started with mortgage possibilities, could you please share your approximate annual household income?" and "Thanks! And about how much are you typically able to save each month?".
3.  **Confirmation:** Briefly acknowledge receipt of both pieces of information.
4.  **Providing Advice (Only After Gathering Info):**
    * Once you have **both** annual income and monthly savings, you can proceed.
    * Provide **general** advice based on their input. Explain concepts like:
        * How income impacts borrowing power (briefly mention Debt-to-Income ratio).
        * How savings relate to down payments and closing costs.
        * General affordability rules of thumb (e.g., housing costs ~28-36% of gross income), stating these are *guidelines*.
    * You can use the search tool (Tavily) to find *current general average* mortgage rates if relevant, but clearly state these are averages and individual rates vary.
    * **DO NOT** give specific loan amount approvals, guarantees, or personalized financial plans.
5.  **Disclaimer:** Always conclude mortgage-related advice by stating that you are an AI providing preliminary information and the user should consult a qualified financial advisor or mortgage lender for personalized advice.
6.  **Other Topics:** If the user asks about unrelated financial topics, answer helpfully. If they return to mortgages, check if you have the income/savings details before giving mortgage-specific advice.

**Constraint:** Do **NOT** provide any mortgage calculations, affordability estimates, or discuss specific loan types *before* you have collected **both** the annual income and monthly savings from the user in the current conversation thread."""

# Create the chat prompt template using the system message
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_MESSAGE),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(
            variable_name="agent_scratchpad"
        ),  # Required for tool usage
    ]
)

# Create the agent
agent = create_tool_calling_agent(llm, agent_tools, prompt)

# Create the Agent Executor
agent_executor = AgentExecutor(
    agent=agent, tools=agent_tools, verbose=True, handle_parsing_errors=True
)

# --- Conversation Memory ---

conversations = defaultdict(
    lambda: ConversationBufferMemory(memory_key="chat_history", return_messages=True)
)

# --- FastAPI Router ---

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


# --- <<< MODIFIED PART: Endpoint Path Reverted >>> ---
@router.post(
    "/api/financeagent", response_model=ChatResponse
)  # Endpoint path reverted to original
async def finance_agent_endpoint(
    request: ChatRequest,
):  # Function name also reverted for consistency
    """
    Endpoint for LangChain-based financial chat agent, currently focused on
    guiding users through mortgage pre-qualification questions (income/savings)
    before providing advice.
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        session_id = request.session_id or "default_session"
        memory = conversations[session_id]

        response = await agent_executor.ainvoke(
            {"input": request.message, "chat_history": memory.chat_memory.messages}
        )

        output_message = response.get(
            "output", "Sorry, I encountered an issue processing your request."
        )

        memory.save_context({"input": request.message}, {"output": output_message})

        return ChatResponse(response=output_message, session_id=session_id)

    except Exception as e:
        print(f"Error in finance agent endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An internal server error occurred. Please try again later.",
        )


# --- (Optional) Main execution block ---
# if __name__ == "__main__":
#     import uvicorn
#     # Assuming 'app' is your FastAPI() instance in your main file
#     # and you mount the router: app.include_router(router)
#     print("Run this API using: uvicorn your_main_app_file:app --reload")
