inventory = {}

while True:

    print("\n1.Add Item")
    print("2.View Inventory")
    print("3.Update Stock")
    print("4.Search Item")
    print("5.Delete Item")
    print("6.Exit")

    choice = int(input("Enter the choice"))

    if choice == 1:
        item = input("enter item name ")
        qty = int(input("enter quantity "))

        inventory[item] = qty

    elif choice == 2:
        print(inventory)

    elif choice == 3:
        item = input("enter item to update ")
        qty = int(input("enter new quantity "))

    elif choice == 4:
        item = input("enter item name ")
        if item in inventory:
            print("item found")

        else:
            print("item not found")

    elif choice == 5:
        item = int(input("enter item name " ))
        del inventory[item]

    elif choice == 6:
        break