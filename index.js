const express = require('express')
const app = express()
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var Patient = require("./models/patient");
var Shift = require("./models/shift");
var Log = require("./models/log");
var User = require("./models/user");
var cors = require('cors');
var jwt = require("jsonwebtoken");
var port = process.env.PORT || 3000;
var jwtSecret = "some secret"


function createToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username, profession: user.profession, password: user.password },
        jwtSecret,
        {
            expiresIn: 86400 // 86400 expires in 24 hours
        }
    );
}

//change mongodb url to this mongodb://127.0.0.1:27017/okok in case of remote

mongoose.connect('mongodb://vijay:vijay18399@ds149676.mlab.com:49676/chat?retryWrites=false', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});


const connection = mongoose.connection;

connection.once("open", () => {
    console.log("MongoDB database connection established successfully!");
});

connection.on("error", err => {
    console.log(
        "MongoDB connection error. Please make sure MongoDB is running. " + err
    );
    process.exit();
});


app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/users', function (req, res) {
    User.findOne({ username: req.body.username }, (err, staff) => {
        if (err) {
            console.log(err);
            return res.status(400).json({ 'msg': err });
        }
        if (staff) {
            return res.status(400).json({ 'msg': 'account already exists for current staff username' });
        }
        else{
            req.body.createdAt = new Date;
            let newUser = User(req.body);
            newUser.save((err, user) => {
                if (err) {
                    console.log(err);
                    return res.status(400).json({ 'msg': err });
                }
                return res.status(201).json(user);
            });
        }
 
    });
})

app.post('/auth', function (req, res) {
    User.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(400).send({ 'msg': err });
        }
        if (!user) {
            return res.status(400).json({ 'msg': 'The User account does not exist' });
        }
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (isMatch && !err) {
                return res.status(200).json({
                    token: createToken(user)
                });
            } else {
                return res.status(400).json({ msg: ' username and password don\'t match.' });
            }
        });
    });
})
app.get('/users', function (req, res) {
    User.find({}).sort({'createdAt' : 1}).exec((err, users) => {
        if (users) {
          console.log(users);
          return res.status(201).json(users);
        }
      });
});
app.get('/users/:id', function (req, res) {
    User.find({ _id : { $eq: req.params.id } }, (err, user) => {
        if(user){
            return res.status(201).json(user);
        }
        if (err) {
            console.log(err);
            return res.status(400).json({ msg: 'User not updated yet' });
        }
      });
});

app.put('/users/:id', function (req, res) {
    User.updateOne({ _id : { $eq: req.params.id } }, req.body, (err, data) => {
        if(data){
            return res.status(201).json({ msg: 'User Updated successfully' });
        }
        if (err) {
            console.log(err);
            return res.status(400).json({ msg: 'User not updated yet' });
        }
      });
});



app.get('/patients', function (req, res) {
    Patient.find({ isDischarged : false}).sort({'createdAt' : 1}).exec((err, patients) => {
        if (patients) {
          console.log(patients);
          return res.status(201).json(patients);
        }
      });
    });
app.post('/patients', function (req, res) {
    req.body.createdAt = new Date;
    console.log(req.body);
    let newPatient = Patient(req.body);
    newPatient.save(function(err, data) {
      if (err) {
        console.log(err);
        return res.status(400).json({ msg: 'patient not created yet' });
      }
      if (data) {
        console.log(data);
        return res.status(201).json(data);
      }
    });
  });
  app.get('/patient/:_id', function (req, res) {
    Patient.find({ _id : { $eq: req.params._id } }, (err, data) => {
        if(data){
            return res.status(201).json(data);
        }
        if (err) {
            console.log(err);
            return res.status(400).json({ msg: 'ID Not exists' });
        }
      });
  });

  app.put('/patient/:_id', function (req, res) {
      req.body.lastUpdatedAt = new Date;
    Patient.updateOne({ _id : { $eq: req.params._id } }, req.body, (err, data) => {
        if(data){
            return res.status(201).json({ msg: 'patient Updated successfully' });
        }
        if (err) {
            console.log(err);
            return res.status(400).json({ msg: 'patient not updated yet' });
        }
      });
  });
 
  app.delete('/patient/:_id', function (req, res) {
      data = {
          'isDischarged': true
      }
    Patient.updateOne({ _id : { $eq: req.params._id } }, data, (err, data) => {
        if(data){
            return res.status(201).json({ msg: 'patient Status made Discharged' });
        }
        if (err) {
            console.log(err);
            return res.status(400).json({ msg: 'patient not updated yet' });
        }
      });
  });

  app.post('/shifts', function (req, res) {
    req.body.time = new Date;
    let newShift = Shift(req.body);
    newShift.save(function(err, data) {
      if (err) {
          console.log(err);
        return res.status(400).json({ msg: 'Shift not created yet' });
      }
      if (data) {
        return res.status(201).json(data);
      }
    });
  });
  app.get('/shiftbyuser/:id', function (req, res) {
    Shift.find({ username : req.params.id}).sort({'time' : 1}).exec((err, shift) => {
        if (shift) {
          console.log(shift);
          return res.status(201).json(shift);
        }
      });
    });
    app.get('/shiftforpatient/:id', function (req, res) {
        Shift.find({ patient_id :  req.params.id}).sort({'time' : 1}).exec((err, shift) => {
            if (shift) {
              console.log(shift);
              return res.status(201).json(shift);
            }
          });
        });


        app.post('/logs', function (req, res) {
            req.body.time = new Date;
            let newLog = Log(req.body);
            newLog.save(function(err, data) {
              if (err) {
                  console.log(err);
                return res.status(400).json({ msg: 'Log not created yet' });
              }
              if (data) {
                return res.status(201).json(data);
              }
            });
          });
          app.get('/logforpatient/:id', function (req, res) {
            Log.find({ patient_id : req.params.id}).sort({'time' : 1}).exec((err, log) => {
                if (log) {
                  console.log(log);
                  return res.status(201).json(log);
                }
              });
            });

app.listen(port);