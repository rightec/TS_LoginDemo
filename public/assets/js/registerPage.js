function new_user(){
    console.log("new_user called");
    let divLogBlock = document.getElementById("login_form");
    let divRegBlock = document.getElementById("register_form");
    //console.log(divLogBlock);
    //console.log(divRegBlock);
    divLogBlock.style.display = "none";
    divRegBlock.style.display = "block";
}

function backToLogin(){
    console.log("backToLogin called");
    let divLogBlock = document.getElementById("login_form");
    let divRegBlock = document.getElementById("register_form");
    divLogBlock.style.display = "block";
    divRegBlock.style.display = "none";
}

console.log("RegisterPage.js");
new_user();