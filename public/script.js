/*
  This is your site JavaScript code - you can add interactivity!
*/

// Print a message in the browser's dev tools console each time the page loads
// Use your menus or right-click / control-click and choose "Inspect" > "Console"
console.log("Hello 🌎");

//NEW
const liffId = "2007882928-VWgW2jYN";
const FromUrl = "https://obscure-space-spoon-7jx7qj44v7fx6q7-5173.app.github.dev/";

async function reduirectUser() {
  try {

    await liff.init({liffId});

    if(!liff.isLoggedIn()){
      liff.login(window.location.href);
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;
    
    window.location.replace("https://obscure-space-spoon-7jx7qj44v7fx6q7-5173.app.github.dev/");

  } catch (error) {

    console.error("LIFF ERROR : " + error);
    alert("เกิดข้อผิดพลาด")

  }
}
