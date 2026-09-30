async function main() {
  const res = await fetch("http://localhost:3000/peserta");
  const html = await res.text();
  console.log("Status:", res.status);
  console.log("HTML length:", html.length);
  const regex = /href="(\/_next\/[^"]+)"|src="(\/_next\/[^"]+)"/g;
  let match;
  const assets = [];
  while ((match = regex.exec(html)) !== null) {
    assets.push(match[1] || match[2]);
  }
  console.log("Found assets count:", assets.length);
  for (const asset of assets.slice(0, 5)) {
    const aRes = await fetch("http://localhost:3000" + asset);
    console.log("Asset:", asset, "=> Status:", aRes.status, "Type:", aRes.headers.get("content-type"));
  }
}
main().catch(console.error);
