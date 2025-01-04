export const GAMEDATA = {
    1: {
        words: ["DAISY","AZALEA","RIVER","IRIS","HYDRANGEA","CARNATION"],
        enumerations: ["(5a)","(6)","(5b)","(4)","(9a)","(9b)"],
        clues: ["Jay Gatsby's love","Rhododendron relative","Water under the bridge","Eye part","\x22Water vessel\x22 in Greek","China, as it is the largest producer?"],
        themeClue: ["\x22Devour again to return mature\x22"],
        themeAnswer: ["FLOWER"],
        sharedLetters: [
            {
                indices: [[0,1],[1,0]]
            },
            {
                indices: [[0,2],[2,1],[3,0]]
            },
            {
                indices: [[0,3],[3,3]]
            },
            {
                indices: [[0,4],[4,1]]
            },
            {
                indices: [[1,5],[4,4],[5,1]]
            },
            {
                indices: [[2,0],[3,1]]
            },
            {
                indices: [[2,4],[4,3],[5,2]]
            }
        ]
    },
    2: {
        words: ["PANTS","EXHAUSTED","SCARF","FEDORA","SOCK","SKIRT","COAT"],
        enumerations: ["(5a)","(8)","(5b)","(6)","(4a)","(5c)","(4b)"],
        clues: ["Huffs and puffs","Beat","Gobble, with \x22down\x22","Iron TV explorer?","Hit","Go around","Cover"],
        themeClue: ["\x22Given under oath, beheaded, and shot\x22"],
        themeAnswer: ["WORN"],
        sharedLetters: [
            {
                indices: [[0,1],[1,3]]
            },
            {
                indices: [[0,4],[1,5],[2,0],[4,0],[5,0]]
            },
            {
                indices: [[0,3],[1,6]]
            },
            {
                indices: [[2,3],[3,4],[5,3]]
            },
            {
                indices: [[2,4],[3,0]]
            },
            {
                indices: [[6,0],[4,2]]
            },
            {
                indices: [[6,1],[4,1]]
            },
            // {
            //     indices: [[6,2],[2,2],[3,5]]
            // },
            {
                indices: [[1,0],[1,7]]
            }
        ]
    },
    3: {
        words: ["MOTOROLA","BLACKBERRY","APPLE","NOKIA","SAMSUNG","ACIDIC"],
        enumerations: ["(8)","(10)","(5a)","(5b)","(7)","(6)"],
        clues: ["Razr maker","It's red when it's green","American pie","Carless?","Galaxy creator","Sharp-tasting"],
        themeClue: ["\x22Ring up rice noodle soup with next half off\x22"],
        themeAnswer: ["PHONE"],
        sharedLetters: [
            {
                indices: [[0,1],[0,5],[3,1]]
            },
            {
                indices: [[0,7],[2,0]]
            },
            {
                indices: [[0,4],[1,7]]
            },
            {
                indices: [[1,0],[1,5]]
            },
            {
                indices: [[1,2],[2,0]]
            },
            {
                indices: [[1,4],[3,2]]
            },
            {
                indices: [[3,3],[5,4]]
            },
            {
                indices: [[3,0],[4,5]]
            },
            {
                indices: [[4,1],[5,0]]
            }
        ]
    },
    4: {
        words: ["POINT","MINT","THUMBPRINT","COMPLAINT","SQUINT","PLAN","SAINT"],
        enumerations: ["(5)","(4)","(10)","(9)","(6)","(4)","(5)"],
        clues: ["Object without dimensions","Coin","Hand's first impression?","Grievance","Peer","Mean","Godsend?"],
        themeClue: ["\x22Tinned bananas give hope\x22"],
        themeAnswer: ["INTEND"],
        sharedLetters: [
            {
                indices: [[0,4],[1,3],[2,0],[2,9]]
            },
            {
                indices: [[2,3],[3,2]]
            },
            {
                indices: [[2,5],[3,3],[5,0]]
            },
            {
                indices: [[3,4],[5,1]]
            },
            {
                indices: [[3,5],[5,2]]
            },
            {
                indices: [[3,8],[4,5]]
            },
            {
                indices: [[4,0],[6,0]]
            },
            {
                indices: [[6,4],[4,5],[3,8]]
            }
        ]
    },
    5: {
        words: ["FOREST","AGAINST","DELIST","DIVEST","BOOST","MODEST","HONEST","BOULEVARD"],
        enumerations: ["(6)","(7)","(6)","(6)","(5)","(6)","(6)","(9)"],
        clues: ["Wood... or one in front?","Touching... or another one?","Remove... or one with Reubens?","Strip... or one with bars?","Plug... or a scary one?","Decent... or a fashionable one?","True... or one for sharpening?","Wide road"],
        themeClue: ["\x22Retweets retracted, resent regularly... make way!\x22"],
        themeAnswer: ["STREET"],
        sharedLetters: [
            {
                indices: [[0,1],[4,2],[5,1]]
            },
            {
                indices: [[0,3],[3,3],[6,3]]
            },
            {
                indices: [[4,0],[7,0]]
            },
            {
                indices: [[2,0],[7,8]]
            },
            {
                indices: [[1,0],[1,2],[7,6]]
            },
            {
                indices: [[1,4],[6,2]]
            },
            {
                indices: [[2,3],[3,1]]
            },
            {
                indices: [[7,3],[2,2]]
            },
            {
                indices: [[7,4],[2,1]]
            }
        ]
    }
}

//format: (index in WORDS, index in string),(index in WORDS, index in string),

// let start_x = Math.floor(Math.random() * 100)
// let start_y = Math.floor(Math.random() * 100)

// export const CNTLPTS = [
//     [{x: start_x, y: start_y},
//     {x: Math.floor(Math.random() * 500), y: Math.floor(Math.random() * 500)},
//     {x: Math.floor(Math.random() * 500), y: Math.floor(Math.random() * 500)},
//     {x: start_x+500, y: start_y+500}]
// ]