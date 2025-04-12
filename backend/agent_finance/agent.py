from datetime import datetime, timedelta, date
from langgraph.graph import MessagesState
from langchain.callbacks.tracers import ConsoleCallbackHandler
from langchain_core.tools import tool
from dataclasses import dataclass, is_dataclass, asdict
#data definition
import random
import typing
from typing import Annotated, Literal
from typing_extensions import TypedDict
import functools
# TODO user data generation and let agent estimate the values (and more relevant data) from flows directly
#from langchain.agents.format_scratchpad.openai_tools import (
#    format_to_openai_tool_messages,
#)
#from langchain.agents.output_parsers.openai_tools import OpenAIToolsAgentOutputParser
from langchain.agents import AgentExecutor, initialize_agent, AgentType
from langchain.memory import ConversationBufferMemory

import json
from pprint import pprint
#from langchain_openai import ChatOpenAI
from typing import Self
import matplotlib.pyplot as plt
from langchain_google_genai import ChatGoogleGenerativeAI


import langgraph as lg
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage



TragbarkeitsZins = 1.06
RISK_FREE_RETURN = 1.05





@dataclass
class investment_type:
    name : str
    ror: float
    volatility: float

#basically asking the bot to invent/remember portfolio theory :)
@dataclass
class investment:
    kind : investment_type
    start : datetime
    additional_monthly_input : int
    #payout_days : int | None #30 or 360 probs
    backed_by: Self | None = None
    value: int = 0


@dataclass
class client_finance:
    third_pillar : investment | None
    second_pillar : investment
    other_investments : list[investment]
    saving_rate : float
    debt : investment
    salary_yearly : int
    salary_bonus_yearly : int
    savings : int
    years_till_retirement : int
    fixed_expenses : int
    risk_tolerance : float



@dataclass 
class investment_point:
    date: datetime
    #just assume symmetric spread
    lower_bound: int
    upper_bound: int
    #investment: investment

@dataclass
class prediction_result:
    years_till_affordable: int
    time_data = list[investment_point]


example_investment = investment(
    kind=investment_type(
        name="Raiffeisen Aktien 1",
        ror=0.08,
        volatility=0.3,
    ),
    start=datetime(2024, 1, 1),
    additional_monthly_input=1000,
)

example_debt = investment(
    kind=investment_type(
        name="Schulden",
        ror= -0.50,
        volatility=.8,
    ),
    start=datetime(2024, 1, 1),
    additional_monthly_input=0,
    value = -3000000
)

#yes ewwww
global_client_finance = client_finance(
    third_pillar=None,
    second_pillar=example_investment,
    other_investments=[example_investment],
    saving_rate=0.2,
    debt=example_debt,
    salary_yearly=100000,
    salary_bonus_yearly=20000,
    savings=100000,
    years_till_retirement=30,
    fixed_expenses=2000,
    risk_tolerance=0.5
)

global_active_investments = []

global_target_amount = 1_200_000

pprint(json.dumps(example_investment, default=str, indent=4))


#Input: target amount, user financial situation
#Output 2.1: selection of actions to take on portfolio/investments to make, years to achieve amount
#Output 2.2: what changes to make to house wish to decrease saving duration or what increased risk to take


@tool
def regulations() -> dict:
    """Returns regulations related to mortgages and investments. 
    
    """
    with open("./raiffeisenprodukte.md", "r") as f:
        return {"messages: ": f.read()}


@tool
def financial_instruments() -> dict:
    """Returns a list of financial instruments available in the market.
    
    Returns:
        list: A list of financial instruments.
    """
    return {"messages": str(financial_instruments_fn())}

def financial_instruments_fn() -> list[investment_type]:
    return [
        investment_type(
            name="Raiffeisen Aktien 1",
            ror=0.08,
            volatility=0.3,
        ),
        investment_type(
            name="Raiffeisen Aktien 2",
            ror=0.09,
            volatility=0.4,
        ),
        investment_type(
            name="Raiffeisen Third Pillar",
            ror=0.02,
            volatility=0.1,
        )
    ]


@tool 
def add_investment(name: str) -> dict:
    """Adds an investment to the list of investments.
    
    Args:
        name (str): The name of the investment to be added.
    
    Returns:
        str: A message indicating the addition of the investment.
    """
    global_active_investments.append(financial_instruments_fn.filter(lambda x: x.name == name).next())
    return {"messages": f"Investment {name} added."}


@tool
def remove_investment(name: str) -> dict:
    """Removes an investment from the list of investments.
    
    Args:
        name (str): The name of the investment to be removed.
    
    Returns:
        str: A message indicating the removal of the investment.
    """
    global global_active_investments
    global_active_investments = [x for x in global_active_investments if x.kind.name != name]
    return {"messages": f"Investment {name} removed."}


@tool
def current_user_investments(client: client_finance) -> dict[list[investment]]:
    """Returns the current investments of the client.
    
    Args:
        client (client_finance): The client's financial situation.
    
    Returns:
        list: A list containing the client's current investments.
    """
    return {"messages": financial_instruments_fn()}

def current_user_investments_fn(client: client_finance):
    investments = [
        client.second_pillar,
    ]
    investments.extend(client.other_investments)

    if client.third_pillar: investments.append(client.third_pillar)
    if client.debt: investments.append(client.debt)
    return investments

@dataclass
class duration_input:
    client: client_finance
    investments: list[investment]
    target_amount: int
    risk_tolerance: str

@tool
def duration_till_amount() -> dict[list[investment_point], int]:
    """
    returns the sum of investments for all years and the number of years to reach the target amount with the given investments and risk tolerance.

    Args:
        duration_in.client (client_finance): The client's financial situation.
        duration_in.investments (list[investment]): The list of investments. This should only include those fetched from financial_instruments and those the user has in the beginning. Do not invent new ones.
        duration_in.target_amount (int): The target amount the client wants to achieve.
        duration_in.risk_tolerance (str): The client's risk tolerance level. 
    
    Returns:
        list[investment_point]: A list of investment points representing the future value of the investments.
        year (int): The number of years until the target amount is reached.
    """
    return {"messages": duration_till_amount_fn(global_client_finance, global_target_amount)}

def duration_till_amount_fn(
    client: client_finance,
    investments: list[investment],
    target_amount: int,
) -> dict: 
    #solve for years
    is_affordable_since = 1000000
    years_to_additionally_forecast = 3
    max_years = 100

    targets = house_price_fn(target_amount, max_years)
    series = [[]]
    results = []
    for investment in investments:
        series[0].append(investment_point(datetime.now(), investment.value, investment.value))
    for year in range(1, max_years):
        #add savings, assuming person keeps same salary
        savings = client.salary_yearly * client.saving_rate + client.salary_bonus_yearly * client.saving_rate
        this_years_investements = sum((x.additional_monthly_input for x in investments))
        assert(savings > this_years_investements)
        client.savings = savings - this_years_investements

        this_year_total_lower = client.savings
        this_year_total_upper = client.savings

        date=datetime.now() + timedelta(days=365*year)

        #calculate the future value of the investments
        series_n = []
        for i, investment in enumerate(investments):
            # Update the investment value
            investment.value += (investment.additional_monthly_input * 12)
            investment.value *= (1 + investment.kind.ror)

            # Calculate bounds based on the updated value and volatility
            series_n_low = investment.value / (1 + investment.kind.volatility)
            series_n_up = investment.value * (1 + investment.kind.volatility)

            # Append the new investment point
            series_n.append(investment_point(date, series_n_low, series_n_up))

            # Update the total lower and upper bounds for this year
            this_year_total_lower += series_n_low
            this_year_total_upper += series_n_up
        series.append(series_n)

        results.append(investment_point(
            date,
            lower_bound=this_year_total_lower,
            upper_bound=this_year_total_upper,
        ))

        #check if the future value, adjusted for risk tolerance, is greater than or equal to the target amount
        is_affordable = this_year_total_lower + (this_year_total_upper - this_year_total_lower)*client.risk_tolerance >= targets[year] - 3*client.salary_yearly/12
        is_affordable &= targets[year]*(1-TragbarkeitsZins) < 0.3 * client.salary_yearly
        #the 10% raw cash, max 10% from second/third pillar requirement is ignored here :) [as are probably quite some more regulations]
        if is_affordable: 
            years_to_additionally_forecast -= 1
            if is_affordable_since > year:
                is_affordable_since = year

        if years_to_additionally_forecast == 0:
            break
            
    return (results, is_affordable_since)


@tool
def house_price_prediction(current_value : int, years : int) -> dict[list[float]]:
    """Returns in the house price for the next years years
    
    Args:
        current_value (int): The current value of the house.
        years (int): The number of years to forecast.
    """
    return {"messages": house_price_fn(current_value, years)}

def house_price_fn(current_value, years):

    r = []
    for i in range(years):
        r.append(current_value * (RISK_FREE_RETURN ** i))
    return r 


def user_happy() -> dict[str]:
    """Returns a positive message to the user."""
    return {"messages": random.choice(["yes i am very happy", "no this takes too long"])}




# stolen from https://tomaugspurger.net/posts/serializing-dataclasses/
@functools.singledispatch
def encode_value(x: typing.Any) -> typing.Any:
    if is_dataclass(x):
        return asdict(x)

    return x

@encode_value.register(datetime)
@encode_value.register(date)
def _(x: date | datetime) -> str:
    return x.isoformat()


@encode_value.register(complex)
def _(x: complex) -> list[float, float]:
    return [x.real, x.imag]


def serialize(x):
    return json.dumps(x, default=encode_value)




#https://langchain-ai.github.io/langgraph/tutorials/workflows/#agent




llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-001",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

# Augment the LLM with tools
tools=[regulations, financial_instruments, house_price_prediction, current_user_investments, duration_till_amount, remove_investment, add_investment]
tools_by_name = {tool.name: tool for tool in tools}
llm_with_tools = llm.bind_tools(tools)


def llm_call(state: MessagesState):
    """LLM decides whether to call a tool or not"""

    return {
        "messages": [
            llm_with_tools.invoke(
                [
                    SystemMessage(
                        content="You are a helpful assistant tasked with performing arithmetic on a set of inputs."
                    )
                ]
                + state["messages"]
            )
        ]
    }

def tool_node(state: dict):
    """Performs the tool call"""

    result = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
    return {"messages": result}


# Conditional edge function to route to the tool node or end based upon whether the LLM made a tool call
def should_continue(state: MessagesState) -> Literal["environment", END]:
    """Decide if we should continue the loop or stop based upon whether the LLM made a tool call"""

    messages = state["messages"]
    last_message = messages[-1]
    # If the LLM makes a tool call, then perform an action
    if last_message.tool_calls:
        return "Action"
    # Otherwise, we stop (reply to the user)
    return END
            


if __name__ == "__main__":
    c = client_finance(
        third_pillar=None,
        second_pillar=example_investment,
        other_investments=[example_investment],
        saving_rate=0.2,
        debt=example_debt,
        salary_yearly=200000,
        salary_bonus_yearly=20000,
        savings=100000,
        years_till_retirement=30,
        fixed_expenses=2000,
        risk_tolerance=0.5
    )
    target_amount = 1_000_000
    s, y = duration_till_amount_fn(
        c,
        current_user_investments_fn(c),
        target_amount,
    )
    print("Years to reach target amount:", y)
    # Plot the lower and upper bounds
    lower_bounds = [point.lower_bound for point in s]
    upper_bounds = [point.upper_bound for point in s]
    years = [point.date.year for point in s]  # Extract the year from the date attribute
    house_price = house_price_fn(target_amount, len(years))

    # Ensure the lengths of years and house_price match
    house_price = house_price[:len(years)]

    fig, ax = plt.subplots()

    # Use grey tones for a professional look
    ax.plot(years, lower_bounds, label='Lower Bound', marker='o', color='salmon')
    ax.plot(years, upper_bounds, label='Upper Bound', marker='o', color='lightsteelblue')

    # Fill the area between the lower and upper bounds with a light grey color
    ax.fill_between(years, lower_bounds, upper_bounds, color='lightgrey', alpha=0.5)

    # Plot house price
    ax.plot(years, house_price, label='House Price', marker='o', color='black')

    # Add labels and title
    ax.set_xlabel('Year')
    ax.set_ylabel('Available Funds')
    ax.set_title('Financial Projection')
    #ax.legend()

    # Show the plot
    plt.savefig("example_plot.png")

    pprint(serialize(c))



    p = f"""
    You are an experienced investment advisor in Switzerland. Help a client reach their housing goal. Keep it positive and hopeful. The targeted houses currently cost around {target_amount}. The customer should have at least 3 months of salary in their savings account in cash. Do keep in mind the regulations. Help the customer structure their portfolio to afford a home, try out a few approaches, be creative.
    Here's some information on your client in json: {serialize(c)}.
    Think about and ask to clarify if a SARON or fixed rate mortgage is better for the client.
    """

    #agent = initialize_agent(tools=[regulations, financial_instruments, house_price_prediction, current_user_investments, duration_till_amount, remove_investment, add_investment], llm=llm, agent_type=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION, verbose=True)
    #agent.run(p)
    class State(TypedDict):
        # Messages have the type "list". The `add_messages` function
        # in the annotation defines how this state key should be updated
        # (in this case, it appends messages to the list, rather than overwriting them)
        messages: Annotated[list, add_messages]
    

#    graph.add_node("Regulations", regulations)
#    graph.add_node("Financial Instruments", financial_instruments)
#    graph.add_node("House Price Prediction", house_price_prediction,)
#    graph.add_node("current_user_investments", current_user_investments)
#    graph.add_node("duration_till_amount", duration_till_amount)
#    graph.add_node("remove_investment", remove_investment)
#    graph.add_node("add_investment", add_investment)
#    graph.add_node("user_happy", user_happy)
#    
#    graph.set_entry_point("Regulations")
#    graph.set_finish_point("user_happy")
#
#    graph.add_edge(START, "Regulations")
#    graph.add_edge("Regulations", "Financial Instruments")
#    graph.add_edge("Financial Instruments", "House Price Prediction")
#    graph.add_edge("House Price Prediction", "current_user_investments")
#    #graph.add_edge("Financial Instruments", "current_user_investments")
#    graph.add_edge("current_user_investments", "add_investment")
#    graph.add_edge("current_user_investments", "remove_investment")
#
#    graph.add_edge("add_investment", "remove_investment")
#    graph.add_edge("remove_investment", "add_investment")
#
#    graph.add_edge("add_investment", "current_user_investments")
#    graph.add_edge("remove_investment", "current_user_investments")
#
#    graph.add_edge("current_user_investments", "duration_till_amount")
#    graph.add_edge("duration_till_amount", "current_user_investments")
#    graph.add_edge("duration_till_amount", "Financial Instruments")
#
#    graph.add_edge("duration_till_amount", "user_happy")
#
#    graph.add_edge("user_happy", END)


    # Build workflow
    agent_builder = StateGraph(MessagesState)

    # Add nodes
    agent_builder.add_node("llm_call", llm_call)
    agent_builder.add_node("environment", tool_node)

    # Add edges to connect nodes
    agent_builder.add_edge(START, "llm_call")
    agent_builder.add_conditional_edges(
        "llm_call",
        should_continue,
        {
            # Name returned by should_continue : Name of next node to visit
            "Action": "environment",
            END: END,
        },
    )
    agent_builder.add_edge("environment", "llm_call")

    # Compile the agent
    agent = agent_builder.compile()

    # Show the agent
    bys = agent.get_graph().draw_mermaid_png()
    with open("graph.png", "wb") as f:
        f.write(bys)

    # Invoke
    agent.invoke({"messages": [HumanMessage(content = p)]},  config={'callbacks': [ConsoleCallbackHandler()]})
