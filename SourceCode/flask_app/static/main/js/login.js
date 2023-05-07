let count = sessionStorage.getItem('loginFailCount');  // sessionStorage works for this
const counterText = document.getElementById('unsuccessful-login-attempts');
const counter = document.getElementById('unsuccessful-login-attempts-count');
if (parseInt(count) > 0) { // only display if failed at least once
    counterText.style.display = "inline";
    counter.textContent = count;
    counter.style.display = "inline";
}

function checkCredentials() {
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
        url: "/processlogin",
        data: data_d,
        type: "POST",
        success:function(returned_data){
              returned_data = JSON.parse(returned_data);

              // Go to home if successful login, otherwise clear input and return to login
              if (returned_data['success'])
              {
                  sessionStorage.setItem('loginFailCount', '0');  // reset fail count on success
                  window.location.href = "/home";
              }
              else
              {
                  if (isNaN(parseInt(count)))
                  {
                      count = 0;
                  }
                  // remember fail count even if you leave /login and come back (within the website)
                  sessionStorage.setItem('loginFailCount', (parseInt(count)+1).toString());
                  window.location.href = "/login";
              }
            }
    });
}
