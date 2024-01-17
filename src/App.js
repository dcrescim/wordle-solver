import "./App.css"
import { useState, useEffect } from "react"
import { possibleWords } from "./wordleList"

let worker = new Worker("/worker.js")

let colorMap = {
  1: "white", // No knowledge
  2: "grey", // Not in there
  3: "orange", // In there in the wrong spot
  4: "green" // In there in the right spot
}

function filterSingleWord(word, allChoices) {
  for (let i = 0; i < allChoices.length; i++) {
    let currentChoice = allChoices[i]

    if (currentChoice.background === 1) {
      continue
    }
    if (currentChoice.background === 2) {
      if (word.includes(currentChoice.letter)) {
        return false
      }
    }
    if (currentChoice.background === 3) {
      let curPosition = i % 5
      if (word[curPosition] === currentChoice.letter) {
        return false
      }

      if (!word.includes(currentChoice.letter)) {
        return false
      }
    }
    if (currentChoice.background === 4) {
      let curPosition = i % 5
      if (word[curPosition] !== currentChoice.letter) {
        return false
      }
    }
  }

  return true
}

function filterWords(allWords, allChoices) {
  return allWords.filter((el) => filterSingleWord(el, allChoices))
}

function FilteredWordsComponent({ allChoices, filteredWords }) {
  if (allChoices.length < 5) {
    return <div>Must choose first word</div>
  }

  if (allChoices.length >= 5 && allChoices.filter((el) => el.background !== 1).length === 0) {
    return (
      <div>
        <p>By clicking on boxes you can set them to grey, yellow, or green.</p>
        <p>Then you will generate list of candidate words.</p>
      </div>
    )
  }

  return (
    <div>
      {filteredWords.slice(0, 50).map((el) => (
        <div key={el}>{el}</div>
      ))}
      {filteredWords.length > 50 ? "... More" : ""}
    </div>
  )
}

const RunSearch = ({ filteredWords }) => {
  let [entropies, setEntropies] = useState([])
  let [loading, setLoading] = useState(true)

  let header = <div style={{ fontSize: "22px", marginBottom: "20px" }}>Next best words</div>

  worker.onmessage = (ev) => {
    setEntropies(ev.data)
    setLoading(false)
  }
  useEffect(() => {
    setLoading(true)
    worker.postMessage(filteredWords)
  }, [filteredWords])

  if (loading) {
    return (
      <div>
        {header}
        <div>Loading...</div>
      </div>
    )
  }
  return (
    <div>
      {header}
      {entropies.slice(0, 10).map((el) => (
        <div key={el.word}>
          {el.word}: {(-1 * el.entropy).toFixed(2)}
        </div>
      ))}
    </div>
  )
}

function NextBestWord({ allChoices, filteredWords }) {
  let header = <div style={{ fontSize: "22px", marginBottom: "20px" }}>Next best words</div>

  if (
    allChoices.length % 5 !== 0 ||
    allChoices.length === 0 ||
    allChoices.filter((el) => el.background === 1).length > 0
  ) {
    return (
      <div>
        {header}
        <div>Waiting for a complete word (with colors) to start looking...</div>
      </div>
    )
  }

  if (filteredWords.length <= 2) {
    return (
      <div>
        {header}
        {filteredWords.map((el) => {
          return <div key={el}>{el}: 1.00</div>
        })}
      </div>
    )
  }

  return <RunSearch filteredWords={filteredWords} />
}

function SingleChoice({ letter = "", backgroundColor = 1, onClick }) {
  let actualColor = colorMap[backgroundColor]
  return (
    <div
      style={{
        width: "80px",
        height: "80px",
        border: "1px solid black",
        backgroundColor: actualColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "30px"
      }}
      onClick={onClick}
    >
      {letter.toUpperCase()}
    </div>
  )
}

function Row({ rowNumb, setChoices, allChoices }) {
  return (
    <div style={{ display: "flex" }}>
      {[0, 1, 2, 3, 4].map((el) => {
        let index = rowNumb * 5 + el
        let curChoice = allChoices[index]
        return (
          <SingleChoice
            key={index}
            letter={curChoice?.letter || ""}
            backgroundColor={curChoice?.background || 1}
            onClick={() => {
              let newChoices = [...allChoices]
              let curVal = newChoices[index]
              if (curVal?.background === undefined) {
                return
              } else if (curVal.background === 4) {
                curVal.background = 1
              } else {
                curVal.background += 1
              }
              setChoices(newChoices)
            }}
          />
        )
      })}
    </div>
  )
}

function App() {
  let [allChoices, setChoices] = useState([])
  let [addWord, setAddWord] = useState('')
  useEffect(() => {
    // function handleKeyDown(e) {
    //   console.log("in handleKeyDown")
    //   let actualChoices = "abcdefghijklmnopqrstuvwxyz"
    //   let value = e.key.toLowerCase()
    //   if (!actualChoices.includes(value) && value !== "backspace") {
    //     return
    //   }
    //   if (value === "backspace") {
    //     const newChoices = [...allChoices]
    //     newChoices.pop()
    //     setChoices(newChoices)
    //     window.removeEventListener("keydown", handleKeyDown)
    //     return
    //   }

    //   const newChoices = [...allChoices]
    //   newChoices.push({ letter: value, background: 1 })
    //   setChoices(newChoices)
    //   window.removeEventListener("keydown", handleKeyDown)
    // }

    // window.addEventListener("keydown", handleKeyDown)
  }, [allChoices])

  let filteredWords = filterWords(possibleWords, allChoices)

  return (
    <>
    <div style={{display: 'flex', justifyContent: 'center'}}>
    <input type="text" placeholder="Your Word" value={addWord} onChange={(e) => {
          console.log("in onChange")
          e.preventDefault()
          e.stopPropagation()
          setAddWord(e.target.value)}
        }/>
      <button onClick={() => {
          const newChoices = [...allChoices]
          for(let i = 0; i < addWord.length; i++){
            let char = addWord[i]
            newChoices.push({ letter: char, background: 1 })
            
          }
          setChoices(newChoices)
          setAddWord('')
        }}> Add Word</button>
    </div>
    <div
      className="App"
      style={{ display: "grid", gridTemplateColumns: "20% 60% 20%", justifyContent: "center", marginTop: "100px" }}
    >
      <div style={{ marginLeft: "25px" }}>
        <div>
          <div style={{ fontSize: "22px", marginBottom: "20px" }}>All available words</div>
          <FilteredWordsComponent allChoices={allChoices} filteredWords={filteredWords} />
        </div>
      </div>
      <div style={{ justifySelf: "center" }}>
        <Row rowNumb={0} setChoices={setChoices} allChoices={allChoices} />
        <Row rowNumb={1} setChoices={setChoices} allChoices={allChoices} />
        <Row rowNumb={2} setChoices={setChoices} allChoices={allChoices} />
        <Row rowNumb={3} setChoices={setChoices} allChoices={allChoices} />
        <Row rowNumb={4} setChoices={setChoices} allChoices={allChoices} />
        <Row rowNumb={5} setChoices={setChoices} allChoices={allChoices} />
      </div>
      <div style={{ marginRight: "40px" }}>
        <NextBestWord allChoices={allChoices} filteredWords={filteredWords} />
      </div>

    </div>
    </>
  )
}

export default App
