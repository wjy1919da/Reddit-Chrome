
function test_addon_background(str){
    console.log(str)
}

function getKey(item){
	console.log(item.isHighLight)
}
function onError(error) {
  console.log(error)
}
// Asynchronous Method Invocation
function loadStorage(key){
	console.log("key is: ",key)
	browser.storage.local.get(key).then(getAuth, onError);
}



function insertdata(uid)
{
  //var insert_date=  new Date();
  fetch("https://redditchrome.herokuapp.com/api/insert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      
      userid: uid,
      user_action_onReddit:[],
      browser_history:[]
    })
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error("Failed to insert data");
    }
  })
  .then(data => {
    console.log("Data inserted successfully:", data);
  })
  .catch(error => {
    console.error(error);
  });
  
}

// insert user action into db
function insertUserAction(uid, action, target,action_date) {
	//const insert_date = new Date();
	console.log("uid: ",uid,"action: ",action,"target: ",target,"action_date: ",action_date)
	fetch("https://redditchrome.herokuapp.com/api/updateUserAction", {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json"
	  },
	  body: JSON.stringify({
		userid: uid,
		user_action_onReddit: [{
		  action_date: action_date,
		  user_action: action,
		  action_target: target
		}]
	  })
	})
	.then(response => {
	  if (response.ok) {
		return response.json();
	  } else {
		throw new Error("Failed to insert user action");
	  }
	})
	.then(data => {
	  console.log("User action inserted successfully:", data);
	})
	.catch(error => {
	  console.error(error);
	});
}