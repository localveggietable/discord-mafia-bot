export default function shuffleArray(arr){
    for (let i = 0; i < arr.length - 1; ++i){
        let index = Math.floor(Math.random() * (arr.length - i)) + i;
        let temp = arr[i];
        arr[i] = arr[index];
        arr[index] = temp;
    }

    return arr;
}