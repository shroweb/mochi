import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const assetDir = path.join(root, "src/assets");
const outDir = path.join(assetDir, "generated");
const publicDir = path.join(root, "public");

fs.mkdirSync(outDir, { recursive: true });

const source = {
  logoFull: "ChatGPT Image Jun 21, 2026, 03_57_57 PM.png",
  logoWordmark: "ChatGPT Image Jun 21, 2026, 04_06_29 PM.png",
  crewSheet: "ChatGPT Image Jun 21, 2026, 04_32_25 PM.png",
  cat: "ChatGPT Image Jun 21, 2026, 04_00_32 PM.png",
  storm: "ChatGPT Image Jun 21, 2026, 04_01_31 PM.png",
  rain: "ChatGPT Image Jun 21, 2026, 04_02_43 PM.png",
  sun: "ChatGPT Image Jun 21, 2026, 04_04_00 PM.png",
  snow: "ChatGPT Image Jun 21, 2026, 04_08_57 PM.png",
  cloud: "ChatGPT Image Jun 21, 2026, 04_11_09 PM.png",
};

function isBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const avg = (r + g + b) / 3;

  return min > 240 || (max - min < 16 && avg > 188);
}

async function removeConnectedBackgroundFromImage(image) {
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const seen = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const id = y * width + x;
    if (seen[id]) return;

    const p = id * channels;
    if (!isBackground(data[p], data[p + 1], data[p + 2])) return;

    seen[id] = 1;
    queue.push(id);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let i = 0; i < queue.length; i += 1) {
    const id = queue[i];
    const x = id % width;
    const y = Math.floor(id / width);

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  for (let id = 0; id < seen.length; id += 1) {
    if (seen[id]) data[id * channels + 3] = 0;
  }

  return sharp(data, { raw: { width, height, channels } });
}

async function removeConnectedBackground(inputFile) {
  return removeConnectedBackgroundFromImage(sharp(path.join(assetDir, inputFile)).ensureAlpha());
}

async function saveClean(inputFile, outputFile, size, fit = "contain") {
  const cleaned = await removeConnectedBackground(inputFile);
  return savePrepared(cleaned, outputFile, size, fit);
}

async function savePrepared(cleaned, outputFile, size, fit = "contain") {
  const padded = await cleaned
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 12 })
    .extend({
      top: 28,
      bottom: 28,
      left: 28,
      right: 28,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const buffer = await sharp(padded)
    .resize(size.width, size.height, {
      fit,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  fs.writeFileSync(outputFile, buffer);
}

async function removeSideEdgeFragments(image) {
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const seen = new Uint8Array(width * height);
  const queue = [];
  const component = [];
  const maxArtifactArea = width * height * 0.06;

  const isVisible = (id) => data[id * channels + 3] > 8;

  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || !isVisible(start)) continue;

    queue.length = 0;
    component.length = 0;
    queue.push(start);
    seen[start] = 1;

    let touchesSide = false;
    for (let i = 0; i < queue.length; i += 1) {
      const id = queue[i];
      const x = id % width;
      const y = Math.floor(id / width);
      component.push(id);

      if (x === 0 || x === width - 1) touchesSide = true;

      const neighbours = [id - 1, id + 1, id - width, id + width];
      for (const next of neighbours) {
        if (next < 0 || next >= width * height || seen[next] || !isVisible(next)) continue;
        const nextX = next % width;
        if (Math.abs(nextX - x) > 1) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }

    if (touchesSide && component.length < maxArtifactArea) {
      for (const id of component) data[id * channels + 3] = 0;
    }
  }

  return sharp(data, { raw: { width, height, channels } });
}

async function saveCrewCrop(outputFile, crop, options = {}) {
  const cropped = sharp(path.join(assetDir, source.crewSheet)).extract(crop).ensureAlpha();
  const cleaned = await removeConnectedBackgroundFromImage(cropped);
  const prepared = options.removeSideEdgeFragments
    ? await removeSideEdgeFragments(cleaned)
    : cleaned;
  return savePrepared(prepared, outputFile, { width: 512, height: 512 });
}

await saveClean(source.sun, path.join(outDir, "weather-sun.png"), { width: 512, height: 512 });
await saveClean(source.rain, path.join(outDir, "weather-rain.png"), { width: 512, height: 512 });
await saveClean(source.storm, path.join(outDir, "weather-storm.png"), { width: 512, height: 512 });
await saveClean(source.snow, path.join(outDir, "weather-snow.png"), { width: 512, height: 512 });
await saveClean(source.cloud, path.join(outDir, "weather-cloud.png"), { width: 512, height: 512 });
await saveClean(source.cat, path.join(outDir, "logo-cat.png"), { width: 512, height: 512 });
await saveClean(source.logoFull, path.join(outDir, "logo-full.png"), { width: 650, height: 650 });
await saveClean(source.logoWordmark, path.join(outDir, "logo-wordmark.png"), {
  width: 900,
  height: 360,
});
await saveCrewCrop(path.join(outDir, "crew-sunny.png"), {
  left: 55,
  top: 100,
  width: 380,
  height: 520,
});
await saveCrewCrop(path.join(outDir, "crew-rain.png"), {
  left: 480,
  top: 100,
  width: 390,
  height: 520,
});
await saveCrewCrop(path.join(outDir, "crew-storm.png"), {
  left: 895,
  top: 100,
  width: 385,
  height: 520,
}, { removeSideEdgeFragments: true });
await saveCrewCrop(path.join(outDir, "crew-snow.png"), {
  left: 1330,
  top: 100,
  width: 385,
  height: 520,
});
await saveCrewCrop(path.join(outDir, "crew-hot.png"), {
  left: 1745,
  top: 100,
  width: 390,
  height: 520,
});

await saveClean(source.logoFull, path.join(publicDir, "icon-192.png"), {
  width: 192,
  height: 192,
}, "cover");
await saveClean(source.logoFull, path.join(publicDir, "icon-512.png"), {
  width: 512,
  height: 512,
}, "cover");
await saveClean(source.logoFull, path.join(publicDir, "logo-full.png"), {
  width: 650,
  height: 650,
});
await saveClean(source.logoWordmark, path.join(publicDir, "logo-wordmark.png"), {
  width: 900,
  height: 360,
});
