const express = require('express')

const multer = require('multer')

const path = require('path')

const fs = require('fs')

var pitch

var tempo

const bodyParser = require('body-parser')

const {exec} = require('child_process')

var outputFilePath = Date.now() + "output.mp3"

const app  = express()

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

var dir = "public";
var subDirectory = "public/uploads";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);

  fs.mkdirSync(subDirectory);
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });

  const audioFilter = function (req, file, cb) {
    // Accept videos only
    if (!file.originalname.match(/\.(mp3)$/)) {
      req.fileValidationError = "Only audio files are allowed!";
      return cb(new Error("Only audio files are allowed!"), false);
    }
    cb(null, true);
  };

  const upload = multer({storage:storage,fileFilter:audioFilter})

app.use(express.static("public"));


const PORT = process.env.PORT || 3000

app.get('/',(req,res) => {
    res.sendFile(__dirname + "/index.html")
})

app.post('/changepitch',upload.single('file'),(req,res) => {
    if(req.file){
        pitch = req.body.pitch
        tempo = req.body.tempo
        console.log(pitch)
        console.log(tempo)
        console.log(req.file.path)

        exec(`ffmpeg -i ${req.file.path} -af asetrate=44100*${pitch},aresample=44100,atempo=${tempo} ${outputFilePath}`,
        (err,stdout,stderr) => {
            if(err) throw err
            res.download(outputFilePath,(err) => {
                if(err) throw err

                fs.unlinkSync(req.file.path)
                fs.unlinkSync(outputFilePath)
            })
        })
    }
})

app.listen(PORT,() => {
    console.log(`App is listening on Port ${PORT}`)
})