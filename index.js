const express = require("express");
const app = express();
const path = require("path");
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const methodoverride = require("method-override");
app.use(methodoverride("_method"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const ejs_mate = require("ejs-mate");//for create templating.
app.engine("ejs", ejs_mate);

const bcrypt = require("bcryptjs");
let port = 3000;

// Defining the Databases
const Register = require("./src/models/register"); // Registration DB
const Contact = require("./src/models/contact"); // Contact info DB
const venue = require("./src/models/venuelist"); // Location Information DB
const connection = require("./src/db/connection"); // To Define the connection


app.listen(port, () => {
  console.log(`app is listening on ${port}`);
})
app.get("/", (req, res) => {
  res.render("Firstpage.ejs");
})
app.get("/signup", (req, res) => {
  res.render("index.ejs");
})
app.post("/signup", async (req, res) => {
  let userInfo = {
    Username: req.body.Username,
    Email: req.body.Email,
    Password: req.body.Password,
    Location: req.body.Location,
    Sports: req.body.Sport,
    Age: req.body.Age,
  }
  const register = new Register(userInfo);
  try {
    const registered = await register.save();

    res.send("you successfully registered");
  }
  catch (error) {
    res.send("couldn't");
  }

}
);

app.get("/signin", (req, res) => {
  res.render("index.ejs");
})

// TODO: *testing* Setting up a cookie session
app.use(cookieSession({
  name: 'session',
  keys: ['COGPC0648E'],
  maxAge: 24 * 60 * 60 * 1000, // 1 Day in this example
}));

// Sign In
app.post("/signin", async (req, res) => {
  let user = {};
  try {
    const Username = req.body.Username;
    const Password = req.body.Password;
    // const Email=req.body.Email;

    // Check if Email and Password are present in the request body
    if (!Username || !Password) {
      return res.status(400).send("Email and Password are required");
    }

    user = await Register.findOne({ Username });

    // Check if the user exists in the database
    if (!user) {
      return res.status(404).send("User not found");
    }

    const isMatch = await bcrypt.compare(Password, user.Password);

    // Check if the passwords match
    if (isMatch) {
      req.session.user = user;
      console.log({ Password, Username });
      res.render("home.ejs", { user });
    } else {
      res.status(401).send("Invalid Username and password");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }

});

// Contact Us Form
app.post("/contact", async (req, res) => {
  const contact = new Contact({
    Name: req.body.Name,
    Email: req.body.Email,
    Message: req.body.Message,
  })
  const contacted = await contact.save();
  res.send("thank you for reaching us")
})

// Edit Profile form, Getting the data from DB
app.get("/editprofile/:id", async (req, res) => {
  try {
    let { id } = req.params;
    console.log(id);
    let editdata = await Register.findById(id);

    if (!editdata) {
      return res.status(404).send('User not found'); // Handle if user is not found
    }

    res.render("profile.ejs", { editdata });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error while editing');
  }
});






app.put("/editprofile/:id", async (req, res) => {
  const { id } = req.params;
  const { Sports } = req.body; // Assuming you get the sport from the request body

  // Logic to set the image path based on the selected sport
  let imagePath;
  switch (Sports) {
    case 'cricket':
      imagePath = '/assets/cricket.jpg';
      break;
    case 'batminton':
      imagePath = '/assets/batminton.jpg';
      break;
    case 'football':
      imagePath = '/assets/football.jpg';
      break;
    default:
      imagePath = '/assets/default.jpg'; // Set a default image if needed
  }

  try {
    const updatedData = {
      Birthday: req.body.Birthday,
      Detail: req.body.Detail,
      Sports: Sports,
      Contact: req.body.Contact,
      Location: req.body.Location,
      Image: imagePath,
    };

    const user = await Register.findByIdAndUpdate(id, updatedData, { new: true });
    if (!user) {
      res.send("message is not conveying ,sorry");
    }

    res.render("home.ejs", { user });


  }
  catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error while editing2");
  }

});

app.get("/profile", (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).send("Unauthorized");
  }
  res.render("home.ejs", { user })
});

app.get("/venues", async (req, res) => {
  const newvenue = await venue.find({});
  res.render("venues", { newvenue });
})

// app.get("/listing", async (req, res) => {
//   const user = await Register.find({});  //Retrieving all the entries
//   console.log(user);
//   res.render("listing.ejs", { user });
// })

app.get("/filter", async (req, res) => {
  try {
    const { sports, location } = req.query;
    // const { sports, location, ageGroup } = req.query;

    const query = {};

    if (sports) query.Sports = sports;
    if (location) query.Location = location;
    // if (professionalism) query.Professionalism = professionalism;
    // if (ageGroup) query.AgeGroup = ageGroup;
    // if (timings) query.Timings = timings;

    const user = await Register.find(query);  // Retreiving entries based on the filter criteria
    res.render("listing.ejs", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error while fetching profiles");
  }
});

app.get("/listing", async (req, res) => {
  const user = await Register.find({});
  console.log(user);
  res.render("listing.ejs", { user });
})

app.get("/book-venue", (req, res) => {
  res.render("book-venue.ejs");
})

app.post("/book-venue", async (req, res) => {
  const { Sports } = req.body; // Assuming you get the sport from the request body

  // Logic to set the image path based on the selected sport
  let imagePath;
  switch (Sports) {
    case 'cricket':
      imagePath = '/assets/st2.png';
      break;
    case 'betminton':
      imagePath = '/assets/st4.png';
      break;
    case 'football':
      imagePath = '/assets/st1.png';
      break;
    default:
      imagePath = '/assets/st3.png'; // Set a default image if needed
  }
  const Venue = new venue({
    Name: req.body.Name,
    Contact: req.body.Contact,
    Timing: req.body.Timing,
    Sports: Sports,
    Address: req.body.Address,
    Location: req.body.Location,
    Image: imagePath,
  });
  try {
    const bookedVenue = await Venue.save();
    res.render("venues.ejs");

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


