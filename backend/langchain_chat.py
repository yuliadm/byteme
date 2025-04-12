from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
import os

router = APIRouter()

# Initialize the LLM
llm = ChatOpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    model_name="gpt-3.5-turbo",
    temperature=0.7,
)

# Create a conversation chain with memory
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# Create the chat prompt template
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful, friendly AI assistant."),
    ("human", "{input}")
])

# Create the chain
chain = LLMChain(
    llm=llm,
    prompt=chat_prompt,
    memory=memory,
    verbose=True
)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None

@router.post("/api/openapichat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint for LangChain-based chat using OpenAI.
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        # Process the message using the chain
        response = await chain.ainvoke({"input": request.message})
        
        return ChatResponse(
            response=response["text"],
            session_id=request.session_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred processing your request: {str(e)}"
        ) 