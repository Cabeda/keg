const express = require("express");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const app = express();
app.use(express.urlencoded());
const port = process.env.PORT || 3000;

const prisma = new PrismaClient();

function get_random_key() {
  return Math.random().toString(16).slice(2, 8);
}

function get_url_from_req(req) {
  if (req.url.length > 1) {
    return req.url.slice(1);
  } else {
    // Means we need to try and retrieve it as a param
    // Gotta try and retrieve from param
    return req.body.url;
  }
}

async function get_keg_url_by_key(param) {
  return await prisma.links.findUnique({
    where: {
      key: param,
    },
    select: {
      url: true,
    },
  });
}

async function get_keg_url_by_url(url) {
  return await prisma.links.findFirst({
    where: {
      url: url,
    },
    select: {
      key: true,
    },
  });
}

async function create_url(req, res) {
  const url = get_url_from_req(req);
  if (!url) {
    res.status(500).send("No url was provided");
  } else {
    let key = get_random_key();
    const existing_url = await get_keg_url_by_url(url);

    if (!existing_url) {
      const newURL = await prisma.links.create({
        data: {
          url: url,
          key: key,
        },
      });
    } else {
      key = existing_url.key;
    }

    keg_url = `${req.get("host")}/${key}`;
    res.send(keg_url);
  }
}

app.get(["/", "/"], async (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get(["/", "/:key"], async (req, res) => {
  try {
    const key = req.params["key"];
    if (key) {
      const keg_url = await get_keg_url_by_key(key);

      if (!keg_url) {
        res.redirect("/");
      } else {
        const redirect_url = keg_url["url"];
        res.redirect(decodeURI(redirect_url));
      }
    } else {
      res.send("No Key was provided");
    }
  } catch (error) {
    throw error;
  }
});

app.post(["/", "/*"], async (req, res) => {
  try {
    await create_url(req, res);
  } catch (error) {
    throw error;
  }
});

app.listen(port, () =>
  console.log(`Hello Node app listening on port ${port}!`)
);
