
const arrayAnalyNode = [{
			content: null,
			nodes: null
        }]
const nodeChangedArray = [{
    node:null,
    key: null,
    value: null,
    pos:-1
}]
const hideNodeArray = [{
    content: null,
	nodes: null,
    backgroundColor:null
}]
let keywordsWithGroupId; 

try{
    chrome.storage.local.get("global_keywordslist").then(result => {
        keywordsWithGroupId = JSON.parse(result.global_keywordslist);
    });
}catch(e){
    console.log("global_keywordslist error:::",e)
}

var globalDefinations;
let excludedElements = [];
function getGlobalDefinitions() {
    console.log("get global definitions+++++++++")
    try {
        chrome.storage.local.get("global_definitions").then(result => {
            globalDefinations = JSON.parse(result.global_definitions);

            if (!globalDefinations?.excluded_elements) {
                console.log("Site patterns missing. Retrieving now.");
                return;
            }

            for (let site of Object.keys(globalDefinations.excluded_elements)) {
                if (site === location.hostname) {
                    excludedElements = globalDefinations.excluded_elements[site].split(",");
                    break;
                }
            }
        });
    } catch (e) {
        console.log("excludedElements error:::", e)
    }
}

getGlobalDefinitions();


function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
//load blacklist

function insertStylesIntoPage() {
    console.log("insertStyles+++++++++++")
    // Load global site definitions

    chrome.storage.local.get('global_definitions', function (def_result) {
        let globalDefinations = JSON.parse(def_result.global_definitions ?? '{}');
        if (!globalDefinations?.blacklist) {
            log("Site patterns missing. Retrieving now.");
            return;
        }
        insertStylesIntoPageContinue();
    });
};

function insertStylesIntoPageContinue() {
    
    let elementsToHide = '';  
    if (globalDefinations.blacklist) {
        // Apply site-specific selectors if any exist
        for (let site of Object.keys(globalDefinations.blacklist)) {
            if (site === location.hostname) {
                elementsToHide = globalDefinations.blacklist[site];
                break;
            }
        }
        console.log("elementsToHide:::", elementsToHide.length)
        // If site not found, apply the global catchall selectors
        if (!elementsToHide) {
            elementsToHide = globalDefinations.catchall_selectors;
        }
        // Finally, inject the styles into the page
        let style = document.createElement('style');
        style.title = "hide_comments_everywhere";
        style.textContent = elementsToHide ? `${elementsToHide} { display: none !important; visibility: hidden !important } ${globalDefinations.excluded_selectors} { display: unset; visibility: unset }` : '';

        var header = document.querySelector('head');
        if (header) {
            header.appendChild(style);
        } else {
            document.documentElement.prepend(style);
        }
    }    
}

function removeHighlights(node) {
		let span;
		while ((span = node.querySelector('span.highlighted'))) {
		  span.outerHTML = span.innerHTML;
		}
		occurrences = 0;
}
function removeHideWords(node) {
    let span;
    while ((span = node.querySelector('span.chromane-blur_text-blur'))) {
      span.outerHTML = span.innerHTML;
    }
    occurrences = 0;
}

function updateHtmlPage() {
    console.log("update html page")
    //let keywordsWithGroupId = options.keywords;
    function highlight(node, pos, keyword,style) {
      let span = document.createElement('span');
      span.className = 'highlighted' + ' ' + 'style-' + style;
      //console.log("className of span:::",span.className)
     // console.log("text: ",node.textContent,"  pos: ",pos,"  keyword: ",keyword,"  style: ",style)
      let highlighted = node.splitText(pos);
      highlighted.splitText(keyword.length);
      let highlightedClone = highlighted.cloneNode(true);
      span.appendChild(highlightedClone);
      highlighted.parentNode.replaceChild(span, highlighted);
    }     
    for (var i = 0; i < arrayAnalyNode.length; i++) {
       let content = arrayAnalyNode[i].nodes.textContent;
       for (let keyword in keywordsWithGroupId) {
                let keywordRegex = new RegExp('(?:^|\\W)' + escapeRegExp(keyword) + '(?:$|\\W)', 'gi');
                let groupID = keywordsWithGroupId[keyword];
                let match;
                //console.log("keywords: ",keywordRegex,"  groupID: ",groupID,"content",content)
                while ((match = keywordRegex.exec(content)) !== null) {
                    console.log("match: ",match.index)
                    console.log("node: ",arrayAnalyNode[i].nodes)
                    // hightlight 需要return一个词
                    highlight(arrayAnalyNode[i].nodes, match.index + (/\W/.test(match[0][0]) ? 1 : 0), keyword, groupID);
                    
                }    
        }
    }
}
function removeReplaceContent(){
    for(let i = 0;i<nodeChangedArray.length;i++){
        let contentOriginal = nodeChangedArray[i].node.textContent;
        pos = nodeChangedArray[i].pos;
        //console.log("content original: ",contentOriginal,"  emoji value",value.length)
        let key = nodeChangedArray[i].key;
        let value = nodeChangedArray[i].value;
        let contentPart1 = contentOriginal.substring(0,pos);
        let contentPart2 = contentOriginal.substring(pos + value.length,contentOriginal.length);
        let contentChanged = contentPart1 + key + contentPart2;
        nodeChangedArray[i].node.textContent = contentChanged;  
    }
    nodeChangedArray = [];
}

const keywordRegexes = [];
function hideKeywordComments() {
    //const keywordsWithGroupId = options.keywords;
    for (let keyword in keywordsWithGroupId) {
        let groupID = keywordsWithGroupId[keyword];
        if (groupID == "0") {
            keywordRegexes.push({
                keyword: keyword,
                regex: new RegExp('(?:^|\\W)' + escapeRegExp(keyword) + '(?:$|\\W)', 'gi')
            });
        }
    }
    arrayAnalyNode.forEach(node => {
        const content = node.nodes.textContent.toLowerCase();
        keywordRegexes.forEach(keywordRegex => {
            if (keywordRegex.regex.test(content)) {
                let currentNode = node.nodes;
                while (currentNode && currentNode.parentNode) {
                    currentNode = currentNode.parentNode;
                    if (currentNode.classList && currentNode.classList.contains("Comment")) {
                        currentNode.style.display = "none";
                        break;
                    }
                }
            }
        });
    });
}

function hideWords(){
    //let keywordsWithGroupId = options.keywords;
    function hide(node){
        if (node.parentNode.childNodes.length === 1) {
            node.parentNode.classList.add("chromane-blur_text-blur");
        } else {
            let span = document.createElement("span");
            span.innerText = node.textContent;
            node.parentNode.insertBefore(span, node);
            node.parentNode.removeChild(node);
            span.classList.add("chromane-blur_text-blur");
        }
    }
    for(var i = 0;i<arrayAnalyNode.length;i++){
        let content = arrayAnalyNode[i].nodes.textContent.toLowerCase()
        for (let keyword in keywordsWithGroupId) {
            let keywordRegex = new RegExp('(?:^|\\W)' + escapeRegExp(keyword) + '(?:$|\\W)', 'gi');
            let groupID = keywordsWithGroupId[keyword];
            let match;
            while ((match = keywordRegex.exec(content)) !== null && groupID == "0") {
                hide(arrayAnalyNode[i].nodes);  
            }      
        }

    }   
}



function replaceContent(options){
    let index = 0;
    let contentMap = options.contentMap;
    for(var i = 0;i<arrayAnalyNode.length;i++){
       let content = arrayAnalyNode[i].nodes.textContent.toLowerCase();
        for (let [key, value] of contentMap) {
            let keyword = key.toLowerCase();
            let pos = content.indexOf(keyword);
            if(0 <= pos){
                let contentOriginal = arrayAnalyNode[i].nodes.textContent;
                let contentPart1 = contentOriginal.substring(0,pos);
                let contentPart2 = contentOriginal.substring(pos + keyword.length,contentOriginal.length);
                let contentChanged = contentPart1 + value + contentPart2;
                arrayAnalyNode[i].nodes.textContent = contentChanged;
                let nodeChanged = {
                    node:null,
                    key: null,
                    value: null,
                    pos:-1
                }
                nodeChangedArray.push(nodeChanged);
                nodeChangedArray[index].node = arrayAnalyNode[i].nodes;
                nodeChangedArray[index].key = key;
                nodeChangedArray[index].value = value;
                nodeChangedArray[index].pos = pos;
                index++;
                 
            }
        }   
    }   
}
function showComment(){
    console.log("show comment is called...length is: ",document.styleSheets.length)
    for (let i = 0; i < document.styleSheets.length; i++) {
        let stylesheet = document.styleSheets.item(i);
        if (stylesheet.title === 'hide_comments_everywhere') {
            let rules = stylesheet.cssRules || stylesheet.rules;
            for (let j = 0; j < rules.length; j++) {
                let rule = rules.item(j);
                stylesheet.deleteRule(j);
            }
        }
    }
}
function removeHideContent(){
    Array.from(document.querySelectorAll(".chromane-blur_text-blur")).forEach((element) => {
        element.classList.remove("chromane-blur_text-blur");
      });
}
let checked = true;
function analysisDomText(options,node){
    console.log("analysisDomText is called...")
	let index = 0 	
    let currentOpt = options

        function getContentText(node) {
       
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.parentNode == null && node.parentNode.nodeName === 'TEXTAREA') {
                    return;
                }
                //console.log("analysisDomText is called...")
                // Add this check to see if the node is a descendant of an excluded element
                // for(let element in excludedElements){
                //     let excludedParent = node.parentElement.closest(element);
                //     if (excludedParent !== null) {
                //         checked = false;
                //     }else{
                //         checked = true;
                //         break;
                //     }
                // }
                //data-testid="frontpage-sidebar"
                
                //console.log("analysisDomText ...checked is: ",checked)
                let content = node.textContent;
                var notNum = !(/^\d+(\.\d+)?$/.test(content))
                var notAlt = content.slice(0, 1) !== '@'
                if (content !== null && content.trim().length > 3 && notNum && notAlt) {
                    
                    try {
                        const nodeInfo = {
                            content: null,
                            nodes: null,
                            highlighted: false
                        }
                        node.parentElement.setAttribute('high_processed', 1)
                        arrayAnalyNode.push(nodeInfo)
                        arrayAnalyNode[index].content = content
                        arrayAnalyNode[index].nodes = node
                        index++
                    } catch (error) {
                        console.log(error);
                    }
                }
            
            } else {
                // filter
                try{
                    let search = node.parentElement.getAttribute("data-testid")
                   
                }catch(e){
                    console.log("filter error is: ",e)
                }
                let not_menu = true;
                let search;
                if(node.parentElement.getAttribute("role") !== null ){
                    not_menu = false
                }
                if(search === "search-results-sidebar"){
                    not_menu = false
                }
                if (1 === node.nodeType && !/(script|style|textarea|header|svg|img|g|input|button)/i.test(node.tagName) && node.childNodes && not_menu){
                    for (let i = 0; i < node.childNodes.length; i++) {
                        getContentText(node.childNodes[i]);
                    }    
                }
                //console.log("textNode: ",node)
                // if (1 === node.nodeType && !/(script|style|textarea)/i.test(node.tagName) && node.childNodes) {
                //     for (let i = 0; i < node.childNodes.length; i++) {
                //         getContentText(node.childNodes[i]);
                //     }
                // }
            }
        }
        console.log("array length is: ",arrayAnalyNode.length)
        if(currentOpt>0){
            // traverse all the node of DOM
            getContentText(node);
            /*
                Put the text content of each node into a list and send it to background, when we got the
                keyword list back from background.js, we can get the node by the maplist of {node,content}
                then we can change the UI or the content of the node
    
            */
            let arrayAnalyText = arrayAnalyNode.map(ptt => ptt.content)
            chrome.runtime.sendMessage({ type: 'arrayAnalyText', data: arrayAnalyText }).then(function (response) {
                //console.log("response from arrayAnalyText background: ",response);
            });
        }else{
            if(removeTag){
                switch(previousOptions){
                    case 2:  
                        removeTag = false;
                        removeHighlights(document.body);
                        highlightTag = false;
                        break;
                    case 3:
                        removeTag = false;
                        removeReplaceContent();
                        break;
                    case 4:
                        removeTag = false;
                        removeHideContent()
                        hideTag = false;
                        break;
                    case 5:
                        showComment();
                        break;
                    case 6:
                        showComment();
                        break;
                }  
               // removeTag = false;  
            }
            
        }		  
    // });
    
    
}

