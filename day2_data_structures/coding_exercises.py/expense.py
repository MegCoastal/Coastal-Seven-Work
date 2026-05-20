expenses = {}

while True:

    category = input("Enter category: ")

    if category == "exit":
        break

    amount = int(input("Enter amount: "))

    expenses[category] = expenses.get(category, 0) + amount

print("Expenses:", expenses)

total = sum(expenses.values())

print("Total Expense:", total)

highest = max(expenses, key=expenses.get)

print("Highest Spending Category:", highest)