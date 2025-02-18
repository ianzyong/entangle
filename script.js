import { GAMEDATA } from "./words.js";

// get current device width
let deviceWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
let MOBILE_BREAKPOINT = 866;

// ignore non-numeric keys
let numericKeys = Object.keys(GAMEDATA).filter(x => !isNaN(x));
// sort as integers
let sortedKeys = numericKeys.sort((a,b) => parseInt(a) - parseInt(b));
let puzzleNumber = Number(sortedKeys[sortedKeys.length-1]);
let maxPuzzleNumber = puzzleNumber;
let minPuzzleNumber = Number(sortedKeys[0]);

// if there is a query string
if (window.location.href.includes("?")) {
    // get the puzzle number from the query string
    puzzleNumber = window.location.href.match(/(?<=\/\?puzzle=)-?.+/)[0];
    puzzleNumber = decodeURIComponent(puzzleNumber);
    // if the puzzle number is a number, convert to number
    if (!isNaN(puzzleNumber)) {
        puzzleNumber = Number(puzzleNumber);
    } else {
        let hb = document.getElementById("hint-button");
        let cb = document.getElementById("check-button");
        // grey out button
        hb.classList.add("disabled");
        cb.classList.add("disabled");
        let tl = document.getElementById("title")
    }
}

// if GAMEDATA does not have puzzle number
if (!(puzzleNumber in GAMEDATA)) {
    // go to 404 page
    window.location = "https://ianzyong.github.io/entangle/404.html";
}

if (puzzleNumber < 1) {
    let tl = document.getElementById("title")
    tl.style["text-shadow"] = "9px 9px rgb(200, 200, 200)";
    tl.style["animation"] = "color-change 20s ease-in-out infinite";
    let hb = document.getElementById("hint-button");
    // grey out button
    hb.classList.add("disabled");
    // get help-button div
    let helpButton = document.getElementById("help-button");
    helpButton.style["box-shadow"] = "9px 9px rgb(200, 200, 200)";
    helpButton.style["animation"] = "bs-color-change 20s ease-in-out infinite";
}

const WORDS = GAMEDATA[puzzleNumber].words
const ENUMERATIONS = GAMEDATA[puzzleNumber].enumerations
const CLUES = GAMEDATA[puzzleNumber].clues
const THEMECLUE = GAMEDATA[puzzleNumber].themeClue
const THEMEANSWER = GAMEDATA[puzzleNumber].themeAnswer
const SHAREDLETTERS = GAMEDATA[puzzleNumber].sharedLetters

// get textSettings if it exists
const TEXTSETTINGS = GAMEDATA[puzzleNumber].textSettings ? GAMEDATA[puzzleNumber].textSettings : {};

let animationPlayed = false;

var node_memberships = WORDS.slice();
// if any element of WORDS is an array
if (WORDS.some(x => Array.isArray(x))) {
    for (let i = 0; i < WORDS.length; i++) {
        node_memberships[i] = WORDS[i].slice();
    }
}

// split each element in node_memberships into individual letters
for (let i = 0; i < node_memberships.length; i++) {
    if (typeof node_memberships[i] === 'string') {
        node_memberships[i] = node_memberships[i].split("");
    }
}

// for each letter in each word
var current_node = 0;
var skip = false;
for (let i = 0; i < node_memberships.length; i++) {
    for (let j = 0; j < node_memberships[i].length; j++) {
        // check if the current index is the first pair of any object in SHAREDLETTERS
        skip = false;
        for (let k = 0; k < SHAREDLETTERS.length; k++) {
            for (let l = 0; l < SHAREDLETTERS[k].indices.length; l++) {
                if (SHAREDLETTERS[k].indices[l][0] == i && SHAREDLETTERS[k].indices[l][1] == j) {
                    // if the current index is the first pair of any object in SHAREDLETTERS
                    if (l == 0) {
                        // replace all pairs of indices in that object in SHAREDLETTERS with the current node number
                        for (let m = 0; m < SHAREDLETTERS[k].indices.length; m++) {
                            node_memberships[SHAREDLETTERS[k].indices[m][0]][SHAREDLETTERS[k].indices[m][1]] = current_node;
                        }
                    } else {
                        skip = true;
                    }
                }
            }
        }
        if (!skip) {
            node_memberships[i][j] = current_node;
            current_node++;
        } else {
        }
    }
    
}

var num_nodes = current_node;
var numChecks = 0;
var numHints = 0;
var isSolved = false;
var isHinted = new Array(num_nodes).fill(false);

function Node(id, value, containsFirstLetter, containsRepeat, nodeIndicesOfParentWords, adjNodeIndices) {
    this.id = id;
    this.value = value;
    this.containsFirstLetter = containsFirstLetter;
    this.containsRepeat = containsRepeat;
    // parent_word_index: node_indices
    this.nodeIndicesOfParentWords = nodeIndicesOfParentWords;
    this.adjNodeIndices = adjNodeIndices;
}

// use data in WORDS and node_memberships to create nodes
var nodes = [];

var firstLetterNodeIndices = [];

for (let current_node_index = 0; current_node_index < num_nodes; current_node_index++) {
    let containsFirstLetter = [false, []];
    let containsRepeat = false;
    var nodeIndicesOfParentWords = {};
    var adjNodeIndices = [];
    var value = "";
    for (let i = 0; i < node_memberships.length; i++) {
        for (let j = 0; j < node_memberships[i].length; j++) {
            if (node_memberships[i][j] == current_node_index) {
                value = WORDS[i][j]
                nodeIndicesOfParentWords[i] = node_memberships[i];
                if (node_memberships[i].filter(x => x==current_node_index).length > 1) {
                    containsRepeat = true;
                }
                if (j == 0) {
                    containsFirstLetter[0] = true;
                    containsFirstLetter[1].push(i);
                    firstLetterNodeIndices.push([current_node_index,i]);
                    adjNodeIndices.push(node_memberships[i][j + 1]);
                } else if (j == node_memberships[i].length - 1) {
                    adjNodeIndices.push(node_memberships[i][j - 1]);
                } else {
                    adjNodeIndices.push(node_memberships[i][j - 1]);
                    adjNodeIndices.push(node_memberships[i][j + 1]);
                }
            }
        }
    }
    let node = new Node(current_node_index, value, containsFirstLetter, containsRepeat, nodeIndicesOfParentWords, adjNodeIndices);
    nodes.push(node);
}

// sort firstLetterNodeIndices by the second element of each subarray
firstLetterNodeIndices.sort((a,b) => a[1] - b[1]);
// remove the second element of each subarray
firstLetterNodeIndices = firstLetterNodeIndices.map(x => x[0]);

// svg object
let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

// create nodes in dagre
var g = new dagre.graphlib.Graph();

// Set an object for the graph label
g.setGraph({});

// configure layout
g.graph().rankdir = "TB";
g.graph().ranker = "network-simplex";

if (deviceWidth < MOBILE_BREAKPOINT) {
    g.graph().nodesep = 40;
    g.graph().edgesep = 5;
    g.graph().ranksep = 40;
}

// Default to assigning a new object as a label for each new edge.
g.setDefaultEdgeLabel(function() { return {}; });

for (let i = 0; i < nodes.length; i++) {
    g.setNode(nodes[i].id, {label: nodes[i].value, width: 10, height: 10});
}

// set edges
for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes[i].adjNodeIndices.length; j++) {
        // if the reverse edge does not exist in _edgeObjs, add the edge
        let edgeObjs = Object.values(g._edgeObjs);
        let edgeExists = (edgeObjs.some(x => x.v == nodes[i].id && x.w == nodes[i].adjNodeIndices[j]) || edgeObjs.some(x => x.v == nodes[i].adjNodeIndices[j] && x.w == nodes[i].id));
        if (!edgeExists) {
            g.setEdge(nodes[i].id, nodes[i].adjNodeIndices[j]);
        }
    }
}



dagre.layout(g);

function bezier(t, p0, p1, p2, p3) {
    var cX = 3 * (p1.x - p0.x),
        bX = 3 * (p2.x - p1.x) - cX,
        aX = p3.x - p0.x - cX - bX;
  
    var cY = 3 * (p1.y - p0.y),
        bY = 3 * (p2.y - p1.y) - cY,
        aY = p3.y - p0.y - cY - bY;
  
    var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
    var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;
  
    return {x: x, y: y};
}

let color_list = ["#A4A8D1", "#EF626C", "#E2C391", "#52FFB8", "#66C7F4","#D156CB"]

let lines = [];
let linesByWord = [];

let wordsPane = document.getElementById("words-pane");

function initBoard() {
    let title = document.getElementById("title");
    let titleM = document.getElementById("title-m");
    title.textContent = "entangle #" + puzzleNumber;
    titleM.textContent = "entangle #" + puzzleNumber;

    let puzzleName = document.getElementById("main-puzzle-name");
    let puzzleNameM = document.getElementById("main-puzzle-name-m");
    puzzleName.textContent = THEMECLUE[0];
    puzzleNameM.textContent = THEMECLUE[0];

    let board = document.getElementById("game-board");

    // read game state from localstorage if it exists
    let gameState = null;
    let gameStateValues = null;
    if (localStorage.getItem(puzzleNumber)) {
        gameState = JSON.parse(localStorage.getItem(puzzleNumber));
        // check if the game state is malformed
        if (!gameState.isSolved && gameState.values.length !== num_nodes) {
            localStorage.removeItem(puzzleNumber);
            gameState = null;
        } else {
            for (let i = 0; i < gameState.indicesHinted.length; i++) {
                isHinted[gameState.indicesHinted[i]] = true;
            }
            numChecks = gameState.numChecks;
            numHints = gameState.numHints;
            isSolved = gameState.isSolved;
            animationPlayed = gameState.isSolved;
        }
    }

    if (isSolved) {
        addPostGameObjects();
    }

    // get maximum y value from nodes
    let maxY = 0;
    for (let i = 0; i < nodes.length; i++) {
        if (g.node(nodes[i].id).y > maxY) {
            maxY = g.node(nodes[i].id).y;
        }
    }

    // get maximum x value from nodes
    let maxX = 0;
    for (let i = 0; i < nodes.length; i++) {
        if (g.node(nodes[i].id).x > maxX) {
            maxX = g.node(nodes[i].id).x;
        }
    }

    // create elements
    // set board style
    let boardWidth = maxX + 100;
    let boardHeight = maxY + 100;
    let yOffset = 20;
    let xOffset = 25;
    let zoomFactor = 1;
    if (deviceWidth < MOBILE_BREAKPOINT) {
        boardWidth = deviceWidth;
        yOffset = 125 + document.getElementById('main-puzzle-name-m').offsetHeight
        xOffset = (deviceWidth-maxX)/2-20;
        if (deviceWidth < (maxX+50)) {
            // determine zoom factor
            zoomFactor = deviceWidth / (maxX*1.2);
            // yOffset = yOffset/zoomFactor;
            xOffset = (deviceWidth-((maxX+50)*zoomFactor))/2;
            boardHeight = maxY*zoomFactor+100;
        }
    }

    // if the device width is less than the board width
    

    for (let i = 0; i < nodes.length; i++) {
        let element = document.createElement("div");
        element.style.position = "absolute";
        element.style.left = (g.node(nodes[i].id).x*zoomFactor + xOffset) + "px";
        element.style.top = (g.node(nodes[i].id).y*zoomFactor + yOffset) + "px";
        element.style.height = 2*zoomFactor + "rem";
        element.style.width = 2*zoomFactor + "rem";
        element.style.fontSize = 1.5*zoomFactor + "rem";
        element.classList.add("letter-box");
        element.classList.add("animate__animated");
        element.style.zIndex = 1;
        board.appendChild(element);
        // associate the element with a node
        //element.textContent = nodes[i].value.toLowerCase();
        //element.classList.add("filled-box");

        element.node = nodes[i];

        // set content according to gameState
        if (isSolved) {
            element.textContent = nodes[i].value;
            element.classList.add("filled-box");
            element.style.borderColor = getBorderColor(element);
        } else if (gameState && gameState.values[i] !== "") {
            element.textContent = gameState.values[i];
            element.classList.add("filled-box");
            element.style.borderColor = getBorderColor(element);
        }

        if (isHinted[i]) {
            element.classList.add("hinted-box");
            // fill with correct symbol
            element.textContent = nodes[i].value;
        }

        if (nodes[i].containsFirstLetter[0]) {
            element.classList.add("first-letter-box");
            // create a text element above the element with the enumeration
            let enumerations = document.createElement("div");
            //enumeration.textContent += ENUMERATIONS[nodes[i].containsFirstLetter[1]];
            enumerations.style.position = "absolute";
            if (deviceWidth < MOBILE_BREAKPOINT) {
                enumerations.style.left = g.node(nodes[i].id).x*zoomFactor + xOffset - 12*zoomFactor + "px";
                enumerations.style.top = g.node(nodes[i].id).y*zoomFactor + yOffset - 15*zoomFactor + "px";
            } else {
                enumerations.style.left = g.node(nodes[i].id).x*zoomFactor + xOffset - 17*zoomFactor + "px";
                enumerations.style.top = g.node(nodes[i].id).y*zoomFactor + yOffset - 17*zoomFactor + "px";
            }
            // place on bottom of z-index
            enumerations.style.zIndex = 0;
            enumerations.classList.add("enumerations");
            board.appendChild(enumerations);

            let enum_color = "#ffffff";
            
            // for each value in containsFirstLetter, add the enumeration
            for (let j = 0; j < nodes[i].containsFirstLetter[1].length; j++) {
                let enumeration = document.createElement("span");
                enumeration.classList.add("enumeration");
                if (j >= 1) {
                    enumeration.textContent += " ";
                }
                enumeration.textContent += ENUMERATIONS[nodes[i].containsFirstLetter[1][j]];
                enum_color = color_list[(nodes[i].containsFirstLetter[1][j])%color_list.length];
                enumeration.style.color = enum_color;
                enumerations.appendChild(enumeration);
            }
            element.style.borderColor = getBorderColor(element);
        }

        // if the node has multiple parent words
        if (Object.keys(nodes[i].nodeIndicesOfParentWords).length > 1) {
            element.classList.add("intersecting-box");
        }

        // if the node is repeated within the word
        if (nodes[i].containsRepeat) {
            element.classList.add("repeated-box");
        }

        if (isSolved) {
            element.classList.add("unfillable-box");
        }

        //element.style.borderColor = color_list[(element.textContent.charCodeAt(0) - 97)%color_list.length];

        nodes[i].element = element;
    }

    if (localStorage.getItem(puzzleNumber) === null) {
        updateGameState();
    }

    // populate the progress pane
    for (let i = 0; i < ENUMERATIONS.length; i++) {
        let entry = document.createElement("div");
        entry.classList.add("entry");
        //entry.style.color = color_list[i%color_list.length];
        wordsPane.appendChild(entry);
        let enumSpan = document.createElement("span");
        enumSpan.textContent = ENUMERATIONS[i];
        entry.appendChild(enumSpan);
        let wordSpan = document.createElement("span");
        wordSpan.classList.add("entry-word");
        entry.appendChild(wordSpan);
    }

    // get minimum x value from nod
    board.style.width = boardWidth + "px";
    board.style.height = boardHeight + "px";

    // svg attributes
    svg.id = "main-svg";
    svg.setAttribute("width", boardWidth);
    svg.setAttribute("height", boardHeight);
    svg.style.position = "absolute";
    svg.style.left = 0;
    svg.style.top = 0;
    svg.style.zIndex = -1;
    board.appendChild(svg);

    // create a line element connecting each pair of adjacent nodes without repeats
    // get _edgeObjs from g
    let edgeObjs = Object.values(g._edgeObjs);
    for (let i = 0; i < edgeObjs.length; i++) {
        let edge = edgeObjs[i];
        if (!((edge.v === "undefined") || (edge.w === "undefined"))) {
            let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", (g.node(edge.v).x)*zoomFactor + xOffset + 20*zoomFactor);
            line.setAttribute("y1", (g.node(edge.v).y)*zoomFactor  + yOffset + 20*zoomFactor);
            line.setAttribute("x2", (g.node(edge.w).x)*zoomFactor  + xOffset + 20*zoomFactor);
            line.setAttribute("y2", (g.node(edge.w).y)*zoomFactor  + yOffset + 20*zoomFactor);
            line.setAttribute("stroke", "#2e2e2e");
            line.setAttribute("stroke-width", "1px");
            line.terminals = [nodes[edge.v].id, nodes[edge.w].id];
            line.style.zIndex = -1;
            svg.appendChild(line);
            lines.push(line);
        }
    }

    // determine linesByWord
    // for each word in the puzzle
    for (let i = 0; i < WORDS.length; i++) {
        // get the nodes belonging to the word
        let wordNodes = node_memberships[i];
        // get the lines belonging to the word
        let wordLines = [];
        // for each consecutive pair of nodes in the word
        for (let j = 0; j < wordNodes.length - 1; j++) {
            // get the line connecting the two nodes
            let line = getLines(nodes[wordNodes[j]].id, nodes[wordNodes[j+1]].id);
            if (!wordLines.includes(line)) {
                wordLines.push(line);
            }
        }
        linesByWord[i] = wordLines;
    }

    // color filled nodes
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].element.classList.contains("filled-box")) {
            colorLines(nodes[i].id, nodes[i].adjNodeIndices, false);
        }
    }

    let controlPane = document.getElementById("control-pane");
    // set width to a multiple of the number of letters in the longest word
    // find max number in ENUMERATIONS
    let maxLetters = 0;
    for (let i = 0; i < ENUMERATIONS.length; i++) {
        let currentEnum = ENUMERATIONS[i];
        let currentEnumSplit = currentEnum.slice(1,-1).split(",").map(x => parseInt(x));
        let maxEnum = Math.max(...currentEnumSplit);
        if (maxEnum > maxLetters) {
            maxLetters = maxEnum;
        }
    }

    //let maxLetters = Math.max(...WORDS.map(x => x.length));
    let blockWidth = 55;
    let minPaneWidth = maxLetters * blockWidth;
    // get offsetwidth of the puzzle name
    let puzzleNameWidth = puzzleName.offsetWidth;
    if (puzzleNameWidth > minPaneWidth) {
        minPaneWidth = puzzleNameWidth;
    }

    controlPane.style.minWidth = minPaneWidth + "px";

    // add max width to the clue class
    let clueCont = document.getElementById("clue-cont");
    clueCont.style.maxWidth = minPaneWidth + "px";
    let miniMap = document.getElementById("mini-map");
    miniMap.style.maxWidth = minPaneWidth + "px";

    // get viewport height
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    // get body element
    let body = document.getElementsByTagName("body")[0];
    // set body style
    body.style.minHeight = boardHeight + "px";
    body.style.minWidth = boardWidth + minPaneWidth + "px";

    let mainDivider = document.getElementById("main-divider");
    mainDivider.style.maxWidth = boardWidth + minPaneWidth + "px";

}

function addPostGameObjects() {
    let checkButton = document.getElementById("check-button");
    checkButton.textContent = "Results";
    // remove disabled class from the check button
    checkButton.classList.remove("disabled");
    // add a reset button to the fourth row
    let resetButton = document.createElement("button");
    resetButton.id = "reset-button";
    resetButton.classList.add("keyboard-button");
    resetButton.textContent = "Reset";
    let fourthRow = document.getElementById("fourth-row");
    fourthRow.appendChild(resetButton);
}

function displayLevelNodes(allData, worldName) {
    let worldSelectNodes = document.getElementById("world-select-nodes");
    // delete any children of wordlSelectNodes
    while (worldSelectNodes.firstChild) {
        worldSelectNodes.removeChild(worldSelectNodes.firstChild);
    }
    if (worldName === "hard") {
        // get all negative keys from GAMEDATA
        let keys = Object.keys(GAMEDATA).filter(x => parseInt(x) <= 0);
        // add a div for each key
        for (let key of keys.sort((a, b) => a - b)) {
            let div = document.createElement("div");
            div.textContent = key;
            div.classList.add("level-select-node");
            colorLevelNode(div, allData);
            worldSelectNodes.appendChild(div);
        }
    } else if (worldName === "aleph") {
        // get all non number keys from allData
        let keys = Object.keys(allData).filter(x => isNaN(x));
        // remove "debug" if it exists
        keys = keys.filter(x => x !== "debug");
        // add a div for each key
        for (let key of keys) {
            let div = document.createElement("div");
            div.textContent = key;
            div.classList.add("level-select-node");
            colorLevelNode(div, allData);
            worldSelectNodes.appendChild(div);
        }
    } else {
        // get all positive keys from GAMEDATA
        let keys = Object.keys(GAMEDATA).filter(x => parseInt(x) > 0);
        // add a div for each key in descending order
        for (let key of keys.sort((a, b) => b - a)) {
            let div = document.createElement("div");
            div.textContent = key;
            div.classList.add("level-select-node");
            colorLevelNode(div, allData);
            worldSelectNodes.appendChild(div);
        }
    }
}

function colorLevelNode(div, allData) {
    let key = div.textContent;
    if (key in allData) {
        // if the key is solved
        if (JSON.parse(localStorage.getItem(key)).isSolved) {
            div.classList.add("solved-level-node");
        } else if (JSON.parse(localStorage.getItem(key)).values.some(x => x !== "")) {
            div.classList.add("unfinished-level-node");
        }
    }
}

let lastClickedElement = null;
let lastSelectedWord = null;
let lastClickedNode = null;

function cycleWord(lce) {
    if (lce.classList.contains("letter-box")) {

        last_position = null;

        toggleHighlight(lce.node, lastSelectedWord);

        if(!lce.classList.contains("filled-box") && !lce.classList.contains("first-letter-box")) {
            lce.style.removeProperty("border-color")
        }

        // get list of first elements in lastClickedNode.nodeIndicesOfParentWords
        let memberOf = [];
        for (const property in lce.node.nodeIndicesOfParentWords) {
            memberOf.push(property);
        }

        let testWord = lastSelectedWord;
        
        lastSelectedWord = memberOf[0];

        for (let i = 0; i < memberOf.length; i++) {
            if (testWord == memberOf[i]) {
                if (i == memberOf.length - 1) {
                    lastSelectedWord = memberOf[0];
                } else {
                    lastSelectedWord = memberOf[i + 1];
                }
                break;
            }
            
        }
        
        // if text settings includes the current word as a key
        if (lastSelectedWord in TEXTSETTINGS) {
            let startInd = TEXTSETTINGS[lastSelectedWord][0];
            let endInd = TEXTSETTINGS[lastSelectedWord][1];
            let tag = TEXTSETTINGS[lastSelectedWord][2];
            
            // insert tag at startInd and endInd
            clue.innerHTML = CLUES[lastSelectedWord].substring(0,startInd) + "<" + tag + ">" + CLUES[lastSelectedWord].substring(startInd,endInd) + "</" + tag + ">" + CLUES[lastSelectedWord].substring(endInd) + " ";
        } else {
            clue.textContent = CLUES[lastSelectedWord] + " ";
        }
        clueEnum.textContent = ENUMERATIONS[lastSelectedWord];
        clueEnum.style.color = color_list[(lastSelectedWord)%color_list.length];
        
        toggleHighlight(lce.node, lastSelectedWord);

    }
}

function cycleWordList(lce) {

    let nextWordIndex = 0;

    if (lce === null || lce === undefined) {
        nextWordIndex = 0

    } else if (lce.classList.contains("letter-box")) {
        lce.classList.remove("selected-box");
        toggleHighlight(lce.node, lastSelectedWord);

        let wordIndex = lastSelectedWord;
        nextWordIndex = (wordIndex+1) % WORDS.length;

    } else {
        nextWordIndex = 0
    }

    // get nodes belonging to nextWordIndex
    let nextWordNodes = nodes[firstLetterNodeIndices[nextWordIndex]].nodeIndicesOfParentWords[nextWordIndex];
    // if all nodes are filled
    if (nextWordNodes.every(x => nodes[x].element.classList.contains("filled-box"))) {
        last_position = 0;
        lastClickedNode = nodes[nextWordNodes[0]];
    } else {
        // get the first node that is not filled
        let nextWordNodeIndex = nextWordNodes.find(x => !nodes[x].element.classList.contains("filled-box"));
        lastClickedNode = nodes[nextWordNodeIndex];
        last_position = nextWordNodes.indexOf(nextWordNodeIndex);
    }

    //lastClickedNode = nodes[firstLetterNodeIndices[nextWordIndex]];
    lastSelectedWord = nextWordIndex;
    lastClickedElement = lastClickedNode.element;
    lastClickedElement.classList.add("selected-box");

    // if text settings includes the current word as a key
    if (lastSelectedWord in TEXTSETTINGS) {
        let startInd = TEXTSETTINGS[lastSelectedWord][0];
        let endInd = TEXTSETTINGS[lastSelectedWord][1];
        let tag = TEXTSETTINGS[lastSelectedWord][2];
        
        // insert tag at startInd and endInd
        clue.innerHTML = CLUES[lastSelectedWord].substring(0,startInd) + "<" + tag + ">" + CLUES[lastSelectedWord].substring(startInd,endInd) + "</" + tag + ">" + CLUES[lastSelectedWord].substring(endInd) + " ";
    } else {
        clue.textContent = CLUES[lastSelectedWord] + " ";
    }
    clueEnum.textContent = ENUMERATIONS[lastSelectedWord];
    clueEnum.style.color = color_list[(lastSelectedWord)%color_list.length];

    last_position = 0;
    toggleHighlight(lastClickedNode, lastSelectedWord);

    if (lastClickedElement.getBoundingClientRect().top > 0 && lastClickedElement.getBoundingClientRect().bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
        return
    } else {
        lastClickedElement.scrollIntoView({behavior: "smooth"});
    }
}

let clue = document.getElementById("clue");
let clueEnum = document.getElementById("clue-enum");

function updateUrl(new_char) {
    if (window.location.href.includes("?puzzle=")) {
        // if the puzzle query string is in the url
        window.location = window.location.href.replace(/(\?puzzle=)[^\&]+/, '$1' + new_char);
    } else {
        // remove "index.html" from the url if it exists
        if (window.location.href.includes("index.html")) {
            window.location = window.location.href.replace("index.html", "") + "?puzzle=" + new_char;
        } else {
            // add the query string with the updated puzzle number
            window.location = window.location + "?puzzle=" + new_char;
        }
    }
}

function updateMinimap(sameWord) {
    let miniMap = document.getElementById("mini-map");
    if (lastSelectedWord !== null && lastClickedElement.classList.contains("letter-box")) {
        // delete all children of mini-map div, if any
        while (miniMap.firstChild) {
            miniMap.removeChild(miniMap.firstChild);
        }
        // get enumeration for the selected word
        let currentEnum = ENUMERATIONS[lastSelectedWord];
        // split and only keep numbers
        let currentEnumSplit = currentEnum.slice(1,-1).split(",");
        // get longest enum
        let longestEnum = 0;
        for (let i = 0; i < currentEnumSplit.length; i++) {
            if (currentEnumSplit[i] > longestEnum) {
                longestEnum = currentEnumSplit[i];
            }
        }
        // get indices of any decimal enumerations
        let decimalEnumIndices = currentEnumSplit.map((x,index) => x % 1 !== 0 ? index: -1).filter(index => index !== -1);
        currentEnumSplit = currentEnumSplit.map(x => parseInt(x));
        // cumulative sum
        for (let i = 1; i < currentEnumSplit.length; i++) {
            currentEnumSplit[i] += currentEnumSplit[i-1];
        }
        // remove last element
        currentEnumSplit.pop();
        
        let numBreaks = 0;
        // create a copy of each node in the selected word, retaining classes
        for (let [index, nodeIndex] of lastClickedElement.node.nodeIndicesOfParentWords[lastSelectedWord].entries()) {
            let element = nodes[nodeIndex].element.cloneNode(true);
            // remove position styles
            element.style.position = "relative";
            element.style.left = "0px";
            if (element.classList.contains("repeated-box")) {
                element.style.top = "-2.5px";
            } else {
                element.style.top = "0px";
            }
            // if the text content of the box exceeds the width, set the font size so that it fits
            if (element.textContent.length > 2) {
                element.style.fontSize = 2/element.textContent.length + "rem";
            }
            // set box width to fit each word on a single line
            if (50*longestEnum > deviceWidth) {
                element.style.width = "2rem";
                element.style.height = "2rem";
                element.style.fontSize = "1.5rem";
                element.style.zoom = deviceWidth/(55*longestEnum);
            } else {
                element.style.width = "2rem";
                element.style.height = "2rem";
                element.style.fontSize = "1.5rem";
            }
            element.classList.add("mini-box");
            miniMap.appendChild(element);
            // if the node number is in currentEnumSplit, add a br
            if (currentEnumSplit.includes(index+1) && !decimalEnumIndices.includes(currentEnumSplit.indexOf(index+1))) {
                miniMap.appendChild(document.createElement("div"));
                // add break class
                miniMap.lastChild.classList.add("break");
                numBreaks++;
            }
        }
        miniMap.style.minHeight = + 44 + (numBreaks)*49 + "px";
    } else {
        miniMap.style.minHeight = "0px";
    }
}

function updateProgress() {
    if (lastSelectedWord !== null && lastClickedElement.classList.contains("letter-box")) {
        
        // for each word
        for (let wordIndex = 0; wordIndex < WORDS.length; wordIndex++) {
            // get child element of wordsPane corresponding to the current word
            let entry = wordsPane.children[wordIndex];
            let currentEnum = entry.children[0];
            let currentWord = entry.children[1];
            // get the text content from the nodes belonging to the current word
            let currentWordText = "";
            for (let nodeIndex of node_memberships[wordIndex]) {
                if (nodes[nodeIndex].element.textContent) {
                    currentWordText += nodes[nodeIndex].element.textContent;
                } else {
                    currentWordText += "_";
                }
            }
            // if the enumeration contains a comma, add a space at the locations in the enumeration
            if (currentEnum.textContent.includes(",")) {
                // clear the currentWordText
                currentWordText = "";
                let spaceIndices = currentEnum.textContent.slice(1,-1).split(",").map(x => parseInt(x));
                let decimalIndices = currentEnum.textContent.slice(1,-1).split(",").map(x => parseFloat(x));
                let decimalEnumIndices = currentEnum.textContent.slice(1,-1).split(",").map((x,index) => x % 1 !== 0 ? index: -1).filter(index => index !== -1);
                // cumulative sum
                for (let i = 1; i < spaceIndices.length; i++) {
                    spaceIndices[i] += spaceIndices[i-1];
                }
                // TODO: refactor...
                if (currentEnum.textContent.includes(".")) {
                    // ignore spaceIndices at decimalEnumIndices
                    spaceIndices = spaceIndices.filter(x => !decimalEnumIndices.includes(spaceIndices.indexOf(x)));
                    // decimal enumeration
                    let potentialRebusIndices = [];
                    let potentialDecimalIndices = [];
                    for (let i = 1; i < decimalIndices.length; i++) {
                        if ((decimalIndices[i] % 1 !== 0) && (decimalIndices[i-1] % 1 !== 0)) {
                            potentialRebusIndices.push(Math.floor(decimalIndices[i-1]));
                            potentialDecimalIndices.push(decimalIndices[i]);
                        }   
                    }
                    for (let k = 0; k < node_memberships[wordIndex].length; k++) {
                        // if this is a potential rebus index
                        if (potentialRebusIndices.includes(k) && nodes[node_memberships[wordIndex][k]].element.textContent) {
                            let decimalIndex = potentialDecimalIndices[potentialRebusIndices.indexOf(k)];
                            let decimalPart = decimalIndex % 1;
                            let denominator = parseInt(1/decimalPart);
                            // determine if the node's text content can be evenly multiplied by the decimal index
                            let potentialRebus = nodes[node_memberships[wordIndex][k]].element.textContent;
                            if (potentialRebus.length % denominator === 0) {
                                // insert a space at potentialRebus.length/denominator
                                for (let m = 1/denominator; m < 1; m=m+1/denominator) {
                                    currentWordText += potentialRebus.slice(0,parseInt(potentialRebus.length*m)) + " " + potentialRebus.slice(parseInt(potentialRebus.length*m));
                                }
                            } else {
                                currentWordText += potentialRebus;
                            }
                        } else if (nodes[node_memberships[wordIndex][k]].element.textContent) {
                            currentWordText += nodes[node_memberships[wordIndex][k]].element.textContent;
                        } else {
                            currentWordText += "_";
                        }
                        if (spaceIndices.includes(k+1)) {
                            currentWordText += " ";
                        }
                    }
                } else {
                    // integer enumeration
                    for (let k = 0; k < node_memberships[wordIndex].length; k++) {
                        if (nodes[node_memberships[wordIndex][k]].element.textContent) {
                            currentWordText += nodes[node_memberships[wordIndex][k]].element.textContent;
                        } else {
                            currentWordText += "_";
                        }
                        if (spaceIndices.includes(k+1)) {
                            currentWordText += " ";
                        }
                    }
                }
            }
            
            // for puzzle -2
            if (puzzleNumber === -2 && wordIndex != WORDS.length-1 && !(currentWordText).includes("_")) {
                let currentClueSplit = CLUES[wordIndex].split(" ");
                currentWordText = currentWordText + " ≈ " + currentClueSplit[currentClueSplit.length - 1];
            }
            
            currentWord.textContent = currentWordText;
            currentWord.style.color = color_list[(wordIndex)%color_list.length];
            // if currentWordText is not empty, color the text
            if (!(currentWordText).includes("_")) {
                currentEnum.style.color = color_list[(wordIndex)%color_list.length];
            } else {
                // remove color style
                currentEnum.style.color = "";
            }
        }
    }
}

var helpModal = document.getElementById("help-modal");
var levelSelectModal = document.getElementById("level-select-modal");
var resultsModal = document.getElementById("results-modal");
var resetModal = document.getElementById("reset-modal");

document.addEventListener('click', function(event) {
    if ((event.target.lang == "en" || event.target.id == "mini-map" || (event.target.classList.contains("keyboard-button") && event.target.parentElement.parentElement.id === "keyboard-cont") || event.target.id == "keyboard-cont" || event.target.parentElement.id == "keyboard-cont")) {
        return
    }

    if (event.target.classList.contains("close") || (event.target.classList.contains("modal") && !(event.target.parentElement.classList.contains("modal")))) {
        helpModal.style.display = "none";
        levelSelectModal.style.display = "none";
        resultsModal.style.display = "none";
        resetModal.style.display = "none";
    }

    if (event.target.id === "help-button" || event.target.id === "help-button-m") {
        let customModalText = document.getElementById("custom-modal-text");
        helpModal.style.display = "block";
        helpModal.scrollTop = 0;
        if (puzzleNumber > 0) {
            // default text
        } else if (puzzleNumber === -2) {
            customModalText.innerText = "Assume D, E, N, S, I, T, and Y are\r\nsingle-digit numbers expressed in radians.";
            customModalText.style.color = "#b2b2b2";
            customModalText.style.textAlign = "center";
            customModalText.style.margin = "40px auto";
            customModalText.style["letter-spacing"] = "0.2rem";
        } else {
            customModalText.innerText = "All keys are now available.\r\n\r\n";
            // add a span child element to customModalText
            const mention = customModalText.appendChild(document.createElement("span"));
            mention.innerText = "(Mobile users — try desktop?)"
            customModalText.style.color = "#b2b2b2";
            customModalText.style.textAlign = "center";
            customModalText.style.margin = "40px auto";
            customModalText.style["letter-spacing"] = "0.2rem";
            mention.style.color = "#4e4e4e";
        }

    }

    if (event.target.id === "level-select-button" || event.target.id === "level-select-button-m" || (event.target.classList.contains("selector-box") && event.target.firstElementChild.id === "level-select-button-m") || event.target.classList.contains("level-select-button-icon")) {
        levelSelectModal.style.display = "block";
        // get all items from local storage
        const allData = { ...localStorage };
        let allDataKeys = Object.keys(allData);
        // remove "debug" key if it exists
        if (allDataKeys.includes("debug")) {
            allDataKeys.splice(allDataKeys.indexOf("debug"),1);
        }
        if (isNaN(puzzleNumber)) {
            displayLevelNodes(allData,"aleph");
        } else if (puzzleNumber <= 0) {
            displayLevelNodes(allData,"hard");
        } else {
            displayLevelNodes(allData,"normal");
        }
        // if negative keys exist in allData
        if (allDataKeys.some(x => parseInt(x) <= 0)) {
            let hardButton = document.getElementById("hard");
            hardButton.style.display = "block";
        }
        // if non numeric keys exist in allData
        if (allDataKeys.some(x => isNaN(x))) {
            let alephButton = document.getElementById("aleph");
            alephButton.style.display = "block";
        }
        let normalButton = document.getElementById("normal");
        normalButton.style.display = "block";
        // get number of elements in world-select-buttons
        let worldSelectButtons = document.getElementById("world-select-buttons");
        // get number of children with display block
        let numChildren = 0;
        for (let i = 0; i < worldSelectButtons.children.length; i++) {
            if (worldSelectButtons.children[i].style.display === "block") {
                numChildren++;
            }
        }
        // get world-select-progress
        let worldSelectProgress = document.getElementById("world-select-progress");
        // set text
        const MAXWORLDS = 3;
        worldSelectProgress.textContent = `(${numChildren}/${MAXWORLDS})`;
    }

    if (event.target.id === "normal" || event.target.id === "hard" || event.target.id === "aleph") {
        const allData = { ...localStorage };
        displayLevelNodes(allData,event.target.id);
    }

    if (event.target.id === "copy-results") {
        let resultsText = document.getElementById("results-text");
        let rankings = ["👑","🎖️","🏵️","⚜️","🍀","🔰","💠","🥀","🥀","🥀","☠️"]
        // get numerals from results text
        let numerals = resultsText.textContent.split(".")[0].split(" ").filter(x => !isNaN(x));
        let sum = numerals.reduce((a,b) => parseInt(a) + parseInt(b), 0);
        if (sum >= rankings.length) {
            sum = rankings.length-1;
        }
        let copyText =
`entangle #${puzzleNumber}
${THEMECLUE}
${resultsText.textContent.split(".")[0]}. ${rankings[sum]}
https://ianzyong.github.io/entangle/?puzzle=${puzzleNumber}`;
        navigator.clipboard.writeText(copyText)
        // change text of button
        event.target.textContent = "COPIED!";
    }

    if (event.target.parentElement.id == "mini-map") {
        let miniMap = document.getElementById("mini-map");
        let miniMapChildren = miniMap.children;
        // remove children with the break class
        for (let i = 0; i < miniMapChildren.length; i++) {
            if (miniMapChildren[i].classList.contains("break")) {
                miniMap.removeChild(miniMapChildren[i]);
            }
        }
        for (let i = 0; i < miniMapChildren.length; i++) {
            if (event.target == miniMapChildren[i]) {
                lastClickedElement.classList.remove("selected-box");
                lastClickedElement = nodes[lastClickedElement.node.nodeIndicesOfParentWords[lastSelectedWord][i]].element;
                lastClickedElement.classList.add("selected-box");
                last_position = i;
                updateMinimap(true);
                return
            }
        }
    }

    // if (event.target.classList.contains("accordion")) {
    //     event.target.classList.toggle("active");
    //     let panel = event.target.nextElementSibling;
    //     if (panel.style.maxHeight) {
    //         panel.style.maxHeight = null;
    //     } else {
    //         panel.style.maxHeight = 500 + "px";
    //     }
    //     return
    // }

    last_position = null;

    // if the prev div is clicked
    if (event.target.id === "prev" || event.target.id === "prev-m" || (event.target.classList.contains("selector-box") && event.target.firstElementChild.id === "prev-m")) {
        let new_num = puzzleNumber-1;
        if (new_num == 0 || new_num < minPuzzleNumber) {
            return
        } else {
            updateUrl(new_num);
        }
    }

    if (event.target.id === "next" || event.target.id === "next-m"|| (event.target.classList.contains("selector-box") && event.target.firstElementChild.id === "next-m")) {
        let new_num = puzzleNumber+1;
        if (new_num > maxPuzzleNumber) {
            return
        } else {
            updateUrl(new_num);
        }
    }
        
    // if the last clicked element is the same as the current clicked element
    if (lastClickedElement === event.target) {
        cycleWord(lastClickedElement);
        updateMinimap(false);
        return
    }
    // if the last clicked element is a letter-box
    if (lastClickedElement && lastClickedNode && lastClickedElement.classList.contains("letter-box") ) {
        // remove selected-box class and remove highlighting from last word
        lastClickedElement.classList.remove("selected-box");
        // for (let nodeIndex of lastClickedElement.node.nodeIndicesOfParentWords[lastSelectedWord]) {
        //     nodes[nodeIndex].element.classList.remove("highlighted-box");
        // }
        toggleHighlight(lastClickedElement.node, lastSelectedWord);
    }
    // if the clicked element is a letter-box
    if (event.target.classList.contains("letter-box")) {
        // add selected-box class to the clicked element
        event.target.classList.add("selected-box");

        lastClickedNode = event.target.node;

        if (lastClickedNode.containsFirstLetter[0]) {
            lastSelectedWord = lastClickedNode.containsFirstLetter[1][0];
        } else if (lastSelectedWord in lastClickedNode.nodeIndicesOfParentWords) {
            // do nothing
        } else {
            lastSelectedWord = Object.keys(lastClickedNode.nodeIndicesOfParentWords)[0];
        }

        toggleHighlight(lastClickedNode, lastSelectedWord);

        // if text settings includes the current word as a key
        if (lastSelectedWord in TEXTSETTINGS) {
            let startInd = TEXTSETTINGS[lastSelectedWord][0];
            let endInd = TEXTSETTINGS[lastSelectedWord][1];
            let tag = TEXTSETTINGS[lastSelectedWord][2];
            
            // insert tag at startInd and endInd
            clue.innerHTML = CLUES[lastSelectedWord].substring(0,startInd) + "<" + tag + ">" + CLUES[lastSelectedWord].substring(startInd,endInd) + "</" + tag + ">" + CLUES[lastSelectedWord].substring(endInd) + " ";
        } else {
            clue.textContent = CLUES[lastSelectedWord] + " ";
        }
        clueEnum.textContent = ENUMERATIONS[lastSelectedWord];
        clueEnum.style.color = color_list[(lastSelectedWord)%color_list.length];
    } else {
        clue.textContent = "";
        clueEnum.textContent = "";
        // remove elements from mini-map
        let miniMap = document.getElementById("mini-map");
        while (miniMap.firstChild) {
            miniMap.removeChild(miniMap.firstChild);
        }
    }

    lastClickedElement = event.target;
    updateMinimap();
    updateProgress();
});

function toggleHighlight(node, wordInd) {
    let nodeIndices = node.nodeIndicesOfParentWords[wordInd]
    for (let i = 0; i < nodeIndices.length; i++) {
        // if the current node index is contained in nodeindices thus far
        if (!nodeIndices.slice(0,i).includes(nodeIndices[i])) {
            nodes[nodeIndices[i]].element.classList.toggle("highlighted-box");
        }
    }
    toggleLineHighlight(wordInd);
}

function toggleLineHighlight(wordInd) {
    for (let line of linesByWord[wordInd]) {
        line.classList.toggle("highlighted-line");
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const animateCSS = (element, animation, prefix = 'animate__') =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
      const animationName = `${prefix}${animation}`;
      const node = element;
      // if the animation class exists, remove it
      node.classList.remove(`${prefix}animated`, animationName);
  
      node.classList.add(`${prefix}animated`, animationName);
  
      // When the animation ends, we clean the classes and resolve the Promise
      function handleAnimationEnd(event) {
        event.stopPropagation();
        node.classList.remove(`${prefix}animated`, animationName);
        resolve('Animation ended');
      }
  
      node.addEventListener('animationend', handleAnimationEnd, {once: true});
});

const animateCascade = (elementList, animation, delay, prefix = 'animate__') =>
    // call animateCSS on each element in elementList, waiting for a set amount of time between each call
    new Promise((resolve, reject) => {
        for (let i = 0; i < elementList.length; i++) {
            setTimeout(() => {
                animateCSS(elementList[i], animation, prefix);
            }, delay * i);
        }
});

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target;

    if (!target.classList.contains("keyboard-button") || target.classList.contains("disabled")) {
        return
    }
    let key = target.textContent

    if (key === "Del") {
        key = "Backspace"
    }

    if (key === "Check" || key === "Results") {
        let allCorrect = true;
        //let elementsToHint = [];
        let indicesToHint = [];
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].element.textContent) {
                if (nodes[i].element.textContent.toLowerCase() != nodes[i].value.toString().toLowerCase()) {
                    // nodes[i].element.textContent = "";
                    nodes[i].element.style.color = "#f87a7a";

                    //nodes[i].element.classList.remove("filled-box");
                    if (!(nodes[i].containsFirstLetter[0])) {
                        nodes[i].element.style.removeProperty("border-color")
                    }
                    animateCSS(nodes[i].element, 'headShake');
                    // set the lines of the node back to default color
                    colorLines(nodes[i].id, nodes[i].adjNodeIndices, true);
                    allCorrect = false;
                } 
                else {
                    //elementsToHint.push(nodes[i].element);
                    indicesToHint.push(i);
                }
            } else {
                allCorrect = false;
            }
        }
        if (allCorrect) {
            isSolved = true;
            // get check-button
            let checkButton = document.getElementById("check-button");
            checkButton.textContent = "Results";
            if (lastClickedElement && lastClickedElement.classList.contains("letter-box")) {
                toggleHighlight(lastClickedElement.node, lastSelectedWord);
            }
            lastClickedElement = null;
            lastSelectedWord = null;
            clue.textContent = "";
            clueEnum.textContent = "";
            let nodeElements = [];
            for (let i = 0; i < nodes.length; i++) {
                nodeElements.push(nodes[i].element)
            }

            // get minimap and remove all children
            let miniMap = document.getElementById("mini-map");
            while (miniMap.firstChild) {
                miniMap.removeChild(miniMap.firstChild);
            }

            // get copy results button
            let copyResults = document.getElementById("copy-results");
            copyResults.textContent = "COPY RESULTS";

            // numHints is the number of elements with the hinted-box class
            // let numHints = document.getElementsByClassName("hinted-box").length

            //quip based on number of hints used
            let quips = ["perfect!","well done!","not too shabby.","pretty good.","not bad.","satisfactory.","good effort.","well, there's always next time."]
            
            let quipNumber = numHints + numChecks >= quips.length ? quips.length-1 : numHints + numChecks;
            let hintText = numHints == 1 ? " hint" : " hints";
            let checkText = numChecks == 1 ? " check." : " checks.";


            for (let i = 0; i < nodes.length; i++) {
                if (quipNumber == 0) {
                    // set all boxes to a golden color
                    //nodes[i].element.style.color = "#fcd786";
                }
                nodes[i].element.classList.add("unfillable-box");
            }

            let selectedBox = document.querySelector(".selected-box");
            if (selectedBox) {
                selectedBox.classList.remove("selected-box");
            }

            // set results text
            let resultsTitle = document.getElementById("results-title");
            let resultsSubtitle = document.getElementById("results-subtitle");
            let resultsText = document.getElementById("results-text");
            let resultsNameAnswer = document.getElementById("results-name-answer");
            let fullSubtitle = document.getElementById("full-subtitle");
            let resultsModalContent = document.getElementById("results-modal-content");

            resultsTitle.innerText = "entangle #" + puzzleNumber;
            resultsSubtitle.innerText = THEMECLUE;
            resultsNameAnswer.innerText = " — " + THEMEANSWER;
            resultsText.innerText = "solved with " + numHints + hintText + " and " + numChecks + checkText + "\r\n" + quips[quipNumber];

            let extraQuips = [["for hard mode: try messing with the url","wowowowowow","*high five*","wanna go bowling sometime?"]];
            let alephQuips = [];
            // for each non-numeric key in GAMEDATA, add the corresponding unicode character to alephQuips
            for (let key in GAMEDATA) {
                if (isNaN(key)) {
                    alephQuips.push(encodeURIComponent(key));
                }
            }
            let extraQuip = document.getElementById("extra-quip");
            if (isNaN(puzzleNumber)) {
                let extraQuipNumber = Math.floor(Math.random() * alephQuips.length);
                extraQuip.innerText = `...${alephQuips[extraQuipNumber]}...`;
                extraQuip.style["userSelect"] = "text";
            } else if (quipNumber == 0) {
                let extraQuipNumber = Math.floor(Math.random() * extraQuips[quipNumber].length);
                if (puzzleNumber < 1 && extraQuipNumber == 0) {
                    extraQuip.innerText = `...?puzzle=%C2%B6...`;
                    extraQuip.style["userSelect"] = "text";
                } else {
                    // randomly select an extra quip
                    extraQuip.innerText = extraQuips[quipNumber][extraQuipNumber];
                }
            }
            
            let resultsDelay = 50*nodeElements.length+1000;
            if (!animationPlayed) {

                addPostGameObjects();
                // update gamestate
                updateGameState();

                animateCascade(nodeElements, 'flip', 50);
                animationPlayed = true;
            } else {
                resultsDelay = 0;
            }

            const displayResults = () => {
                resultsModal.style.display = "block";
                // set min-width of results-modal
                resultsModalContent.style["minWidth"] = fullSubtitle.getBoundingClientRect().width + 20 + "px";
            };
            setTimeout(displayResults,resultsDelay);
            
        } else {
            // for (let i = 0; i < elementsToHint.length; i++) {
            //     elementsToHint[i].classList.add("hinted-box");
            // }
            for (let i = 0; i < indicesToHint.length; i++) {
                isHinted[indicesToHint[i]] = true;
                nodes[indicesToHint[i]].element.classList.add("hinted-box");
            }
            numChecks++;
            updateGameState();
        }
        updateMinimap(false);
    } else if (key === "Hint") {
        // reveal the currently selected letter
        // get the selected-box element
        let selectedBox = document.querySelector(".selected-box");
        // if there is a selected-box element
        if (selectedBox && selectedBox.classList.contains("letter-box") && !selectedBox.classList.contains("unfillable-box")) {
            selectedBox.textContent = selectedBox.node.value;
            selectedBox.style.color = "#d1d1d1";
            selectedBox.classList.add("filled-box");
            selectedBox.classList.add("hinted-box");
            lastClickedElement.style.borderColor = getBorderColor(lastClickedElement);
            updateMinimap(false);
            updateProgress();
            numHints++;
            isHinted[selectedBox.node.id] = true;
            updateGameState();
        }
    } else if (key === "Reset") {
        resetModal.style.display = "block";
    }
    else {
        document.dispatchEvent(new KeyboardEvent("keydown", {'key': key}))
    }

});

document.getElementById("reset-buttons").addEventListener("click", (e) => {
    const target = e.target;
    let key = target.textContent;
    if (key === "Yes") {
        // clear localStorage
        localStorage.removeItem(puzzleNumber);
        // refresh page
        location.reload();
    } else if (key === "No") {
        resetModal.style.display = "none";
        return
    }
});

document.getElementById("world-select-nodes").addEventListener("click", (e) => {
    const target = e.target;
    // if target is a div with class level-select-node
    if (target.classList.contains("level-select-node")) {
        let new_char = target.textContent;
        updateUrl(new_char);
    }
});

document.getElementById("world-select-nodes").addEventListener("mouseover", (e) => {
    const target = e.target;
    // if target is a div with class level-select-node
    if (target.classList.contains("level-select-node")) {
        let worldSelectAnswer = document.getElementById("world-select-answer");
        let displayText = "?????";
        if (target.classList.contains("solved-level-node")) {
            // from GAMEDATA, get the theme answer
            displayText = GAMEDATA[target.textContent].themeAnswer;
            // add animation
            animateCSS(worldSelectAnswer, 'bounceIn');
        }
        worldSelectAnswer.textContent = displayText;
    }
});

document.getElementById("world-select-nodes").addEventListener("mouseout", (e) => {
    let worldSelectAnswer = document.getElementById("world-select-answer");
    worldSelectAnswer.textContent = "";
});

function blendColors(colors) {
    // blend colors in colors array
    let r = 0;
    let g = 0;
    let b = 0;

    for (let i = 0; i < colors.length; i++) {
        // if color is a hex string
        if (colors[i].substring(0,1) == "#") {
            r += parseInt(colors[i].substring(1,3).toUpperCase(), 16);
            g += parseInt(colors[i].substring(3,5).toUpperCase(), 16);
            b += parseInt(colors[i].substring(5,7).toUpperCase(), 16);
            
        } else if (colors[i].substring(0,3) == "rgb") {
            let rgb = colors[i].match(/\d+/g);
            r += parseInt(rgb[0]);
            g += parseInt(rgb[1]);
            b += parseInt(rgb[2]);
        }
    }
    
    r = Math.round(r / colors.length);
    g = Math.round(g / colors.length);
    b = Math.round(b / colors.length);

    return "#" + r.toString(16).toUpperCase() + g.toString(16).toUpperCase() + b.toString(16).toUpperCase();
}

function darkenRGB(rgb) {
    // if hex convert to rgb
    if (rgb.substring(0,1) == "#") {
        let r = parseInt(rgb.substring(1,3), 16);
        let g = parseInt(rgb.substring(3,5), 16);
        let b = parseInt(rgb.substring(5,7), 16);
        return "rgb(" + Math.round(r * 0.5) + "," + Math.round(g * 0.5) + "," + Math.round(b * 0.5) + ")";
    } else {
        let darkened = [];
        let rgbArray = rgb.match(/\d+/g);
        for (let i = 0; i < rgbArray.length; i++) {
            darkened.push(Math.round(parseInt(rgbArray[i]) * 0.5));
        }
    }
    return "rgb(" + darkened.join(",") + ")";
}

function getBorderColor(element) {
    let col = "#d1d1d1";
    
    if (Object.keys(element.node.nodeIndicesOfParentWords).length>1) {
        let colors = [];

        for (let i = 0; i < Object.keys(element.node.nodeIndicesOfParentWords).length; i++) {
            colors.push(color_list[(Object.keys(element.node.nodeIndicesOfParentWords)[i])%color_list.length]);
        }
        
        col = blendColors(colors);
    } else {
        col = color_list[(Object.keys(element.node.nodeIndicesOfParentWords)[0])%color_list.length];
    }
    return col;
}

function getLines(terminal1,terminal2) {
    return lines.find(line => (line.terminals[0] === terminal1 && line.terminals[1] === terminal2) || (line.terminals[0] === terminal2 && line.terminals[1] === terminal1));
}

function colorLines(currentNode, adjNodes, clear) {
    // get lines that have the current node as a terminal
    for (let i = 0; i < adjNodes.length; i++) {
        let line = getLines(currentNode, adjNodes[i]);
        // skip undefined values
        if (line == undefined) {
            continue;
        }
        if (clear) {
            line.style.removeProperty('stroke');
        } else {
            // get color of current node
            line.style.stroke = darkenRGB(getBorderColor(nodes[currentNode].element));
        }
    }
}

function insertLetter (pressedKey) {
    pressedKey = pressedKey.toLowerCase()
    if (lastClickedElement == null) {
        return
    }
    if (lastClickedElement.classList.contains("letter-box") && !lastClickedElement.classList.contains("hinted-box") && !lastClickedElement.classList.contains("unfillable-box")) {
        lastClickedElement.style.color = "#d1d1d1";
        lastClickedElement.style.removeProperty("color");
        lastClickedElement.textContent = pressedKey;
        lastClickedElement.classList.add("filled-box");
        lastClickedElement.style.borderColor = getBorderColor(lastClickedElement);

        // get adjacent nodes of last clicked element
        let adjNodes = lastClickedElement.node.adjNodeIndices;
        let currentNode = lastClickedElement.node.id;
        
        colorLines(currentNode, adjNodes, false);
        
    }
    cycleLetter(pressedKey, lastClickedElement);
}

function deleteLetter (pressedKey) {
    if (lastClickedElement == null) {
        return
    }
    if (lastClickedElement.classList.contains("letter-box") && !lastClickedElement.classList.contains("hinted-box") && !lastClickedElement.classList.contains("unfillable-box")) {

        lastClickedElement.textContent = ""
        lastClickedElement.classList.remove("filled-box")
        if (!(lastClickedElement.classList.contains("first-letter-box"))) {
            lastClickedElement.style.removeProperty("border-color")
        }

        let nodeIndices = lastClickedElement.node.nodeIndicesOfParentWords[lastSelectedWord];
        // find the position of the last clicked element in nodeIndices
        let position = nodeIndices.indexOf(lastClickedElement.node.id);

        colorLines(lastClickedElement.node.id, lastClickedElement.node.adjNodeIndices, true);

    }
    cycleLetter(pressedKey, lastClickedElement)
}

let last_position = null;

function cycleLetter(pressedKey, lce) {

    if (lce.classList.contains("letter-box")) {

        if (pressedKey === "Delete") {
            return;
        }

        lce.classList.remove("selected-box")

        // select next letter
        let node_indices = lce.node.nodeIndicesOfParentWords[lastSelectedWord];
        let current_position = node_indices.indexOf(lce.node.id);
        if (last_position !== null) {
            current_position = last_position;
        }
        let nextNode = null;
        
        let next_position = null;

        if (pressedKey === "Backspace" || pressedKey === "ArrowLeft" || pressedKey === "ArrowUp") {
            if (current_position == 0) {
                next_position = node_indices.length - 1
                
            }
            else {
                next_position = current_position - 1;
            }
        } else if (pressedKey === "ArrowRight" || pressedKey === "ArrowDown") {
            if (current_position >= node_indices.length - 1) {
                next_position = 0;
            }
            else {
                next_position = current_position + 1;
            }
            
        } else { // letter was pressed, skip to next empty node unless all in the word are filled
            let filled = 0;
            for (let i = 0; i < node_indices.length; i++) {
                if (nodes[node_indices[i]].element.textContent) {
                    filled++;
                }
            }
            if (filled == node_indices.length) {
                if (current_position >= node_indices.length - 1) {
                    next_position = 0;
                }
                else {
                    next_position = current_position + 1;
                }
            } else {
                next_position = current_position;
                while (nodes[node_indices[next_position]].element.textContent) {
                    if (next_position >= node_indices.length - 1) {
                        next_position = 0;
                    } else {
                        next_position++;
                    }
                }
            }
        }

        nextNode = node_indices[next_position];
        
        last_position = next_position;

        // if the new node has the same id as the current node
        if (nextNode === lce.node.id && node_indices.length > 1) {
            cycleLetter(pressedKey, nodes[nextNode].element);
            return;
        }

        // select next element
        lastClickedElement = nodes[nextNode].element;
        // add selected-box class to the element
        lastClickedElement.classList.add("selected-box");
        // check if element is already visible in viewport

        if (lastClickedElement.getBoundingClientRect().top > 0 && lastClickedElement.getBoundingClientRect().bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
            return
        } else {
            lastClickedElement.scrollIntoView({behavior: "smooth"});
        }
    }
}

function updateGameState() {
    // get values from all nodes
    let values = [];
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].element.textContent) {
            values.push(nodes[i].element.textContent);
        } else {
            values.push("");
        }
    }
    // get number of hints used
    let numH = numHints;
    // get number of checks used
    let numC = numChecks;
    // is puzzle solved?
    let solved = isSolved;
    // get indices of True values in ishinted
    let indicesHinted = [];
    for (let i = 0; i < isHinted.length; i++) {
        if (isHinted[i]) {
            indicesHinted.push(i);
        }
    }
    let gameState = {
        "values": values,
        "indicesHinted": indicesHinted,
        "numHints": numH,
        "numChecks": numC,
        "isSolved": solved
    }
    // if puzzleNumber is a number
    if (!isNaN(puzzleNumber) && isSolved) {
        // clear values to save space
        gameState.values = [];
    }
    // save gameState to localStorage
    localStorage.setItem(puzzleNumber, JSON.stringify(gameState));

    // return whether all nodes are correct
    return (values.every((val, i) => val.toLowerCase() === nodes[i].value.toString().toLowerCase()) && !isSolved);
}

document.addEventListener("keydown", (e) => {

    let pressedKey = String(e.key)
    if ((pressedKey === "Backspace") || (pressedKey === "Delete")) {
        deleteLetter(pressedKey)
        updateMinimap(true);
        updateProgress();
        updateGameState();
        return
    }

    if (pressedKey === "Enter") {
        e.preventDefault();
        cycleWord(lastClickedElement)
        updateMinimap(false);
        updateProgress();
        return
    }

    if (pressedKey === "Tab") {
        e.preventDefault();
        cycleWordList(lastClickedElement);
        updateMinimap(false);
        updateProgress();
        return
    }

    // if pressed key is an arrow key
    if (pressedKey === "ArrowLeft" || pressedKey === "ArrowRight" || pressedKey === "ArrowUp" || pressedKey === "ArrowDown") {
        e.preventDefault();
        cycleLetter(pressedKey, lastClickedElement)
        updateMinimap(true);
        updateProgress();
        return
    }

    let found = null;
    if (puzzleNumber > 0) {
        found = (pressedKey.match(/[a-z]/gi) && pressedKey.length === 1)
    } else {
        if (pressedKey[0] === "F") {
            e.preventDefault();
        }
        found = (pressedKey != "Shift")
    }

    
    if (!found || found.length > 1) {
        return
    } else {
        insertLetter(pressedKey)
    }

    updateMinimap(false);
    updateProgress();
    if (updateGameState() && isNaN(puzzleNumber)) {
        // remove disabled class from the check button
        let checkButton = document.getElementById("check-button");
        checkButton.classList.remove("disabled");
        // simulate clicking the check button
        checkButton.click();
    }
})

initBoard()