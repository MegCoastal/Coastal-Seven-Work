name = "Ram"
age = 20
height = 5.8
is_student = True

print(name)
print(age)
print(height)
print(is_student)




num = 10

if num % 2 == 0:
    print("Even")
else:
    print("Odd")




for i in range(1, 6):
    print(i)




def add(a, b):
    return a + b

print(add(10, 20))




a = 0
b = 1

for i in range(7):
    print(a, end=" ")

    temp = a + b
    a = b
    b = temp




try:
    print(10 / 0)
except ZeroDivisionError:
    print("Cannot divide by zero")




num = 15

for i in range(1,6):
    print(num,"* ",i,"=",num*i)



a = 10
b = 16
c = 20
if a>=b and a>=c:
    print("a is largest")
elif b>=a and b>=c:
    print("b is largest")
else:
    print("c is largest")


num = 5
for i in range(2,num):
    num = num*i

print(num)




