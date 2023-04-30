// test blacklist
//insertStylesIntoPage()
// define a maplist of {node,content}
let previousOptions = -1;
let currentOptions = 0;
let removeTag = true;
let highlightTag = false;
let hideTag = false;

browser.runtime.onMessage.addListener(function(request, sender, sendResponse){
    console.log("currentOptions++: "+currentOptions)
    console.log("previousOptions++: "+previousOptions)
    console.log("request++: "+request)
	if ('backgroundReturnOptions' === request.message) {
		sendResponse('send this：'+JSON.stringify(request));
        // Get the text content of browser website and send it to background
       
		if (request.optionValue !== previousOptions){
            currentOptions = request.optionValue;
			//analysisDomText(currentOptions,document.body)
            previousOptions = currentOptions;
		}	
        console.log("currentOptions: "+currentOptions)
        console.log("previousOptions: "+previousOptions)
	}
    // if "isHighlight button is on"
	// if ('returnKeywords' === request.message) {
	// 	sendResponse('send this：'+JSON.stringify(request));
        // switch(currentOptions){
        //     case 2:
        //         if(!highlightTag){
        //             highlightTag = true;
        //             removeTag = true;
        //             //updateHtmlPage({'keywords':request.keywordsWithGroupId}); 
        //             updateHtmlPage();
        //         }
        //         break;
        //     case 3:
        //         removeTag = true;
        //         replaceContent({'contentMap':request.sortedMap});
        //        // replaceContent();
        //         break;
        //     case 4:
        //         if(!hideTag){
        //             hideTag = true;
        //             removeTag = true;
        //             //hideWords({'keywords':request.keywordsWithGroupId});
        //             hideWords();
        //         }
        //         break;
        //     case 5:
        //     // hide comments everywhere  
        //         insertStylesIntoPage();
        //         break;
        //     case 6:
        //         console.log("case 6")
        //         //hideKeywordComments({'keywords':request.keywordsWithGroupId});
        //         hideKeywordComments();
        //         break;
        // }
	// }	
});		

const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
	  if (mutation.addedNodes && mutation.addedNodes.length > 0) {
		for (let i = 0; i < mutation.addedNodes.length; i++) {
		  const newNode = mutation.addedNodes[i];
		  analysisDomText(currentOptions,newNode)
		}
	  }
	});
  });
observer.observe(document.body, {
	childList: true,
	subtree: true
});
  

