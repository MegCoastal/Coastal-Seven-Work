votes = {}
voters = set()

while True:
    voter = input("enter voter name: ")
    if voter == "exit":
        break
    if voter not in voters:
        voters.add(voter)
    else:
        print("Already voted")
        continue

    candidate = input("enter candidate name: ")
    votes[candidate] = votes.get(candidate,0) + 1

print("\nVote Count")
print(votes)

winner = max(votes,key=votes.get)
print(winner)
