const express = require("express");
const { PrismaClient } = require("@prisma/client");
const app = express();
const port = process.env.PORT || 3000;

const prisma = new PrismaClient();

function get_random_key() {
    return Math.random().toString(16).slice(2, 8);
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

app.get(["/", "/:key"], async (req, res) => {
  try {
    const key = req.params["key"];
    if (key) {
      const keg_url = await get_keg_url_by_key(key);
      const redirect_url = keg_url["url"];
      res.redirect(decodeURI(redirect_url));
    } else {
      res.send("No Key was provided");
    }
  } catch (error) {
    throw error;
  }
});

app.post(["/", "/*"], async (req, res) => {
  try {
    const url = req.url.slice(1);
    console.log(req.url.slice(1));
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
  } catch (error) {
    throw error;
  }
});

app.listen(port, () =>
  console.log(`Hello Node app listening on port ${port}!`)
);
