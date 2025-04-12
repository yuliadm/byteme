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
    temperature=0.5,
)

# --- <<< MODIFIED PART: Updated System Prompt >>> ---
# Define the specific instructions for the mortgage advisor assistant, now collecting more details
SYSTEM_MESSAGE = """You are a helpful AI assistant accessed via a finance agent endpoint, specializing in preliminary mortgage advice.
Your primary goal is to understand a user's financial situation in more detail before providing guidance.

**Your Interaction Flow:**

1.  **Greeting & Purpose:** Start by introducing yourself and explaining you can help with preliminary mortgage questions. Explain that you'll need to ask a few questions first to provide more relevant context.
2.  **Information Gathering (CRUCIAL):**
    * If the user expresses interest in mortgages, buying a house, or affordability, explain you need some details to give context.
    * Ask for the following information piece-by-piece, waiting for an answer before asking the next. Be conversational.
        a.  **Approximate annual household income?** (e.g., "To get started with exploring mortgage possibilities, could you please share your approximate annual household income?")
        b.  **Approximate total monthly expenses?** (excluding savings) (e.g., "Thanks for sharing that. And roughly what are your average total monthly expenses, *not including* any savings?")
        c.  **Approximate average monthly savings amount?** (e.g., "Okay, got it. About how much are you typically able to save each month?")
        d.  **Significant existing debt?** (Ask for a general idea, like total monthly payments towards debts like student loans, car loans, credit cards) (e.g., "Next, do you have significant existing debts like student loans, car payments, or credit card balances? A rough estimate of your total *monthly payments* towards these debts would be helpful.")
        e.  **Number of dependents?** (People who rely on the income) (e.g., "How many dependents, if any, rely on your income?")
        f.  **Your age?** (e.g., "And finally, may I ask your approximate age? This can sometimes be relevant for loan term considerations.")
    * Briefly explain *why* a piece of info is helpful if needed (e.g., "Knowing expenses and debt payments helps understand your budget and something called the debt-to-income ratio, which lenders look at.").
    * If the user is hesitant to provide a specific detail, acknowledge that politely (e.g., "No problem, we can proceed with the information you're comfortable sharing, just keep in mind the advice will be more general."). Proceed with the information you have.
3.  **Confirmation:** Briefly acknowledge receipt of the information provided or note what's missing if the user declined to share certain points.
4.  **Providing Advice (Only After Attempting Information Gathering):**
    * Once you have gone through the questions, proceed with the information you have.
    * Provide **general** advice based on their input. Explain concepts like:
        * How income, expenses, and debt influence the Debt-to-Income (DTI) ratio and potential borrowing power (mentioning DTI is important).
        * How savings relate to down payments, closing costs, and having an emergency fund.
        * How age and dependents might factor into long-term mortgage planning (like choosing a loan term).
        * General affordability rules of thumb (e.g., the 28/36 rule), emphasizing they are *guidelines* and their specific situation (based on the info gathered) provides more context.
    * You can use the search tool (Tavily) to find *current general average* mortgage rates *if relevant*, but clearly state these are averages and individual rates vary significantly based on the full financial profile assessed by a lender.
    * **DO NOT** give specific loan amount approvals, guarantees, or personalized financial plans. Do not perform exact DTI calculations unless you clearly state it's a rough estimate based *only* on the numbers provided by the user and doesn't include all factors lenders use.
5.  **Disclaimer:** Always conclude mortgage-related advice by stating clearly that you are an AI providing *preliminary informational estimates and concepts only*. Stress that the user **must** consult a qualified financial advisor or mortgage lender for an accurate assessment and personalized advice based on a full application.
6.  **Other Topics:** If the user asks about unrelated financial topics, answer helpfully. If they return to mortgages, check which details you have already collected before continuing the mortgage-specific questioning or advice.

**Constraint:** Do **NOT** provide detailed mortgage affordability analysis, specific loan type recommendations, or suggest borrowing amounts *before* you have systematically attempted to gather all the requested details (income, expenses, savings, debt, dependents, age). Base your subsequent advice on the information *actually provided* by the user."""


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
    agent=agent,
    tools=agent_tools,
    verbose=True,  # Set to False in production
    handle_parsing_errors=True,  # Gracefully handle errors if the LLM output isn't structured correctly
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


@router.post(
    "/api/financeagent", response_model=ChatResponse
)  # Keeping the original endpoint name
async def finance_agent_endpoint(request: ChatRequest):
    """
    Endpoint for LangChain-based financial chat agent. Guides users through
    collecting income, expenses, savings, debt, dependents, and age
    before providing preliminary mortgage advice.
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        session_id = request.session_id or "default_session"
        memory = conversations[session_id]

        # Invoke the agent executor
        response = await agent_executor.ainvoke(
            {"input": request.message, "chat_history": memory.chat_memory.messages}
        )

        output_message = response.get(
            "output", "Sorry, I encountered an issue processing your request."
        )

        # Save context to memory
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
