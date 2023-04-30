
const KEYWORDS_JSON = 'https://raw.githubusercontent.com/wjy1919da/FirefoxExtensionDemo/main/lib/test_keywords.json';
const SITES_JSON = 'https://raw.githubusercontent.com/wjy1919da/FirefoxExtensionDemo/main/lib/test_sites.json';
const GLOBAL_DEFINITION_EXPIRATION_SEC = 86400;
function getCurrentSeconds() {
    return new Date().getTime() / 1000 | 0;
}
// MVCC
// Get the latest site definitions.
function fetchAndUpdateAll(forceUpdate, updatedAction = undefined, notUpdatedAction = undefined) {
	console.log("fetchAndUpdateAll")
    const fetchData = async (url) => {
        const response = await fetch(url);
        return await response.json();
    };

    const shouldUpdate = (lastUpdateTime) => {
        return forceUpdate || !lastUpdateTime || getCurrentSeconds() - lastUpdateTime > GLOBAL_DEFINITION_EXPIRATION_SEC;
    };

    chrome.storage.local.get(['keywords_last_update', 'sites_last_update'], (result) => {
        const { keywords_last_update, sites_last_update } = result;

        if (shouldUpdate(keywords_last_update) || shouldUpdate(sites_last_update)) {
            Promise.all([
                fetchData(KEYWORDS_JSON),
                fetchData(SITES_JSON)
            ]).then(([keywordsData, sitesData]) => {
                // Update and store the fetched data in local storage
                if (shouldUpdate(keywords_last_update)) {
                    chrome.storage.local.set({ 'global_keywordslist': JSON.stringify(keywordsData) });
                    chrome.storage.local.set({ 'keywords_last_update': getCurrentSeconds() });

                    if (updatedAction) {
                        updatedAction('keywords');
                    }
                }
                if (shouldUpdate(sites_last_update)) {
                    chrome.storage.local.set({ 'global_definitions': JSON.stringify(sitesData) });
                    chrome.storage.local.set({ 'sites_last_update': getCurrentSeconds() });

                    if (updatedAction) {
                        updatedAction('definitions');
                    }
                }

            }).catch((error) => {
                console.error('Error fetching data:', error);

                if (notUpdatedAction) {
                    notUpdatedAction('keywords');
                    notUpdatedAction('definitions');
                }
            });
        } else {
            if (notUpdatedAction) {
                notUpdatedAction('keywords');
                notUpdatedAction('definitions');
            }
        }
    });
}



// Fires when a new browser tab is opened.
// If it's time to check for new definitions, and there's an update available, retrieve them.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onCreated
chrome.tabs.onCreated.addListener(function () {
    fetchAndUpdateAll(false);
});

// Fires when addon is installed or updated.
// Gets latest definitions.
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install' || details.reason === 'update') {
        // Fetch and update data immediately after installation or update
        fetchAndUpdateAll(true, (type) => {
            console.log(`${type} fetched and updated.`);
        }, (type) => {
            console.log(`No update needed or failed to fetch and update ${type}.`);
        });
    }
});



let email;
// sort map
let tempArray = Array.from(dictionary);
tempArray.sort((pair1, pair2) => {
  // Each pair is an array with two entries: a word, and its emoji.
  // Ex: ['woman', '👩']
  const firstWord = pair1[0];
  const secondWord = pair2[0];

  if (firstWord.length > secondWord.length) {
    // The first word should come before the second word.
    return -1;
  }
  if (secondWord.length > firstWord.length) {
    // The second word should come before the first word.
    return 1;
  }

  // The words have the same length, it doesn't matter which comes first.
  return 0;
});

// Now that the entries are sorted, put them back into a Map.
let sortedEmojiMap = new Map(tempArray);



// receive node
browser.runtime.onMessage.addListener(function(request, sender) {
     // This message is recived from 'content.js' and 'popup.js'.
	 //if the page need to be highligt
	if ('optionsFromPopup' === request.message) {
		let options = request.optionValue
		console.log("receive options from popup: ",options)
        try {
			browser.storage.local.set({'options': options});
		} catch (error) {
			console.log(error);
		}
		chrome.tabs.query(
			{ 
			   active: true, 
			   currentWindow: true
			},
			// send keyword and options to content
			function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					'message': 'backgroundReturnOptions',
					'optionValue': options
					},
					function(response) {
						console.log('receive from options content reponse: ',response);
					}
				);
			}
		);
		//insertdata("1234")
	}
// Auth
	if ('EmailAuth' === request.message) {
		email = request.email;
		let password = request.password;
		try {
			browser.storage.local.set(
				{'email': email,'password':password,'authentication':true}
			);
		} catch (error) {
			console.log(error);
			return;
		}
		// update the auth after email is added
		browser.runtime.sendMessage({
			message: "AuthUpdateFromBackground",
			data: true
		}, (response) => {
			console.log("Auth update response from popup", response);
		});		
	}
	if('popupAuthRequest'===request.message){
		browser.storage.local.get('authentication').then(result => {
			let auth = result.authentication;
			try{
				browser.runtime.sendMessage({
					message: "AuthFromBackground",
					data: auth
				}, (response) => {
					console.log("Auth response from popup", response);
				});	
			}catch(error){
				console.log("load error: ",error)
			}
		});
		
	}
	
});

// set the site into local storage

// listen the content data from content script
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'arrayAnalyText') {
	  console.log("request data of text content");
	  sendResponse({ status: 'success' }); 
	 
	//   try{ 
	// 	let keywordsWithGroupId;
	// 	browser.storage.local.get("global_keywordslist").then(result => {
	// 		keywordsWithGroupId = JSON.parse(result.global_keywordslist);
	// 	});
	// 	browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
	// 			browser.tabs.sendMessage(tabs[0].id, { 
	// 				'message': 'returnKeywords',
	// 				"keywordsWithGroupId":keywordsWithGroupId,
	// 				'sortedMap':sortedEmojiMap
	// 			},
	// 			function(response) {
	// 				console.log('receive from keyword content reponse: ',response);
	// 			}
	// 		);
	// 	});
	//  }catch(error){
	// 	console.log(error)
	//  }	 
	}
// user click actity 
	if (request.type === 'userClickActivity') {
		console.log("userClickActivity data of text content",request.data);
		sendResponse({ status: 'success' });
		let userActities = request.data;
		
	   try{
		browser.storage.local.get('email').then(result => {	
			email = result.email;
			console.log("email is: ",email)
			// set user acitities into extension storage
			browser.storage.local.set({ userActities });
			userActities.forEach(element => {
				console.log("userActities background list: ",element);
				insertUserAction(email,element.action,element.element,element.time)
			});
		});
	   }catch(error){
			console.log("set actities error",error)
			return;
	   }
	}

  });
// update HTML
if ('showOccurrences' === request.message) {
    let showOccurrences = localStorage.getItem('showOccurrences');

    showOccurrences = 'true' === showOccurrences || null === showOccurrences;
// 刷新？？
    browser.browserAction.setBadgeText({
      'text': showOccurrences && request.occurrences ? String(request.occurrences) : '',
      'tabId': sender.tab.id
    });
}
// whether the login window is displayed
browser.storage.local.get('email').then(result => {
	console.log("background start set auth.....")
    const getEmail = result.email;
	email = result.email;
    console.log("background get email: ",getEmail)
	let auth = false;
	let authString = auth.toString();

	if(typeof getEmail === 'undefined'){
		browser.storage.local.set({'authentication': authString});
		console.log("background set auth: ",authString)
	}else{
		auth = true;
		authString = auth.toString();
		browser.storage.local.set({'authentication': authString});
		console.log("background set auth: ",authString)
	}
	
});

  



