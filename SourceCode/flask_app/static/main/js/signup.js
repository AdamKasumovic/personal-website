const signupFailText = document.getElementById('unsuccessful-login-attempts');
let count = sessionStorage.getItem('signupFailCount');  // sessionStorage works for this
if (parseInt(count) > 0) { // only display if failed at least once
    signupFailText.style.display = "inline";
}

function signUp() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // enforce correct input
    if (email.length < 3 || !email.includes("@") || password.length < 8)
    {
        return;
    }

    // package data in a JSON object
    const data_d = {'email': email, 'password': password};

    // SEND DATA TO SERVER VIA jQuery.ajax({})
    jQuery.ajax({
        url: "/processsignup",
        data: data_d,
        type: "POST",
        success:function(returned_data){
              returned_data = JSON.parse(returned_data);

              // Go to login if successful, otherwise clear input, display fail message and refresh
              if (returned_data['success'])
              {
                  sessionStorage.setItem('signupFailCount', '0');  // reset fail count on success
                  // any text would not be visible for long, and I did not want to create artificial load times
                  // so I just do this to make sure users know they have signed up, especially since my login and
                  // signup pages are so similar
                  window.alert("Sign up successful!");
                  window.location.href = "/login";
              }
              else
              {
                  if (isNaN(parseInt(count)))
                  {
                      count = 0;
                  }
                  // remember fail count even if you leave /signup and come back (within the website)
                  sessionStorage.setItem('signupFailCount', (parseInt(count)+1).toString());
                  window.location.href = "/signup";
              }
            }
    });
}
