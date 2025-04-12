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

router = APIRouter()

# Store conversations in memory (in production, use a database)
conversations = defaultdict(lambda: ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
))

# Initialize the LLM
llm = ChatOpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    model_name="gpt-3.5-turbo",
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
    Endpoint for LangChain-based chat using OpenAI with conversation memory.
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        # Get or create memory for this session
        session_id = request.session_id or "default"
        memory = conversations[session_id]

        # Create the chain with memory
        chain = LLMChain(
            llm=llm,
            prompt=chat_prompt,
            memory=memory,
            verbose=True
        )

        # Process the message using the chain
        response = await chain.ainvoke({"input": request.message})
        
        # Save the conversation to memory
        memory.save_context(
            {"input": request.message},
            {"output": response["text"]}
        )
        
        return ChatResponse(
            response=response["text"],
            session_id=session_id
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  # Add logging
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred processing your request: {str(e)}"
        ) 