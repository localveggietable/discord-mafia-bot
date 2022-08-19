class Animal{
    sound(){
        console.log("hi")
    }
}

class Dog extends Animal{
    sound(){
        super.sound();
    }
}

var dog = new Dog();
dog.sound();