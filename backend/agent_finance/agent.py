from datetime import datetime, timedelta
from langchain_core.tools import tool
from dataclasses import dataclass
#data definition
# TODO user data generation and let agent estimate the values (and more relevant data) from flows directly
from langchain.agents.format_scratchpad.openai_tools import (
    format_to_openai_tool_messages,
)
from langchain.agents.output_parsers.openai_tools import OpenAIToolsAgentOutputParser
import json
from pprint import pprint
from langchain_openai import ChatOpenAI
from typing import Self
import matplotlib.pyplot as plt


RISK_FREE_RETURN = 1.03

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
        name="Raiffeisen Aktien 1",
        ror=0.0,
        volatility=0.0,
    ),
    start=datetime(2024, 1, 1),
    additional_monthly_input=1000,
    value = -30000
)

pprint(json.dumps(example_investment, default=str, indent=4))


#Input: target amount, user financial situation
#Output 2.1: selection of actions to take on portfolio/investments to make, years to achieve amount
#Output 2.2: what changes to make to house wish to decrease saving duration or what increased risk to take


@tool
def regulations() -> list:
    """Returns a list of regulations related to mortgages and investments. 
    
    Returns:
        list: A list of regulations.
    """
    pass


@tool
def financial_instruments() -> list[investment_type]:
    """Returns a list of financial instruments available in the market.
    
    Returns:
        list: A list of financial instruments.
    """
    return [
        investment_type(
            name="Raiffeisen Aktien 1",
            ror=0.08,
            volatility=0.3,
        ),
        investment_type(
            name="Raiffeisen Aktien 1",
            ror=0.09,
            volatility=0.4,
        ),
        investment_type(
            name="Raiffeisen Third Pillar",
            ror=0.02,
            volatility=0.1,
        )
    ]


def current_user_investments(client: client_finance) -> list[investment]:
    """Returns the current investments of the client.
    
    Args:
        client (client_finance): The client's financial situation.
    
    Returns:
        list: A list containing the client's current investments.
    """
    investments = [
        client.second_pillar,
        client.debt,
    ]
    investments.extend(client.other_investments)

    if client.third_pillar: investments.append(client.third_pillar)
    return investments


#@tool
def duration_till_amount(
    client: client_finance,
    investments: list[investment],
    target_amount: int,
    risk_tolerance: str,

) -> (list[investment_point], int):
    """
    returns the number of years to reach the target amount with the given investments and risk tolerance.

    Args:
        client (client_finance): The client's financial situation.
        investments (list[investment]): The list of investments.
        target_amount (int): The target amount the client wants to achieve.
        risk_tolerance (str): The client's risk tolerance level. 
    
    Returns:
        list[investment_point]: A list of investment points representing the future value of the investments.
        year (int): The number of years until the target amount is reached.
    """
    #solve for years
    is_affordable_since = 1000000
    years_to_additionally_forecast = 3

    targets = house_price_prediction(target_amount, 100)
    series = [[]]
    results = []
    for investment in investments:
        series[0].append(investment_point(datetime.now(), investment.value, investment.value))
    for year in range(1, 100):
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
        is_affordable = this_year_total_lower + (this_year_total_upper - this_year_total_lower)*risk_tolerance >= targets[year] - 3*client.salary_yearly/12
        if is_affordable: 
            years_to_additionally_forecast -= 1
            if is_affordable_since > year:
                is_affordable_since = year

        if years_to_additionally_forecast == 0:
            break
            
    return (results, is_affordable_since)


#@tool
def house_price_prediction(current_value, years) -> list[float]:
    """Returns in the house price for the next years"""
    r = [current_value]
    for i in range(years+1):
        r.append(current_value * 1.05**i)
    return r

            


if __name__ == "__main__":
    c = client_finance(
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
    target_amount = 1_000_000
    s, y = duration_till_amount(
        c,
        current_user_investments(c),
        target_amount,
        c.risk_tolerance
    )
    house_price = house_price_prediction(target_amount, y)
    print("Years to reach target amount:", y)
    # Plot the lower and upper bounds
    lower_bounds = [point.lower_bound for point in s]
    upper_bounds = [point.upper_bound for point in s]
    years = [point.date.year for point in s]  # Extract the year from the date attribute

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
    ax.legend()

    # Show the plot
    plt.savefig("example_plot.png")






#p = f"You are an experienced investmnet adivisor. Help a client reach their housing goal. Keep it positive and hopeful. The targetted houses currently cost around {target_amount}. The customer should have at least 3 months of salary in their savings account in cash."


#llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
#llm_with_tools = llm.bind_tools([financial_instruments, financial_forecast])





