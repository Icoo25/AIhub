import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";

const blockedHost = (host:string) => {
  const value=host.toLowerCase();
  if(value==="localhost"||value.endsWith(".local")||value==="0.0.0.0"||value==="::1")return true;
  if(value.startsWith("fc")||value.startsWith("fd")||value.startsWith("fe80:"))return true;
  const match=value.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if(!match)return false;
  const [a,b]=[Number(match[1]),Number(match[2])];
  return a===10||a===127||a===0||(a===192&&b===168)||(a===172&&b>=16&&b<=31)||(a===169&&b===254);
};
const assertPublicUrl=async(value:string)=>{const url=new URL(value);if(!["http:","https:"].includes(url.protocol)||blockedHost(url.hostname))throw new Error("Blocked URL");const addresses=await lookup(url.hostname,{all:true});if(addresses.some(item=>blockedHost(item.address)))throw new Error("Blocked network");return url};
const fetchPublic=async(initial:string,signal:AbortSignal)=>{let current=await assertPublicUrl(initial);for(let step=0;step<5;step++){const response=await fetch(current,{signal,headers:{"User-Agent":"AI-Innovation-Hub/1.0"},redirect:"manual"});if(response.status>=300&&response.status<400){const location=response.headers.get("location");if(!location)throw new Error("Invalid redirect");current=await assertPublicUrl(new URL(location,current).toString());continue}return response}throw new Error("Too many redirects")};
const text=(value:string)=>value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();
const tag=(html:string,name:string)=>{const match=html.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"));return match?text(match[1]):""};
const meta=(html:string,key:string)=>{const patterns=[new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']`,"i"),new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`,"i")];for(const pattern of patterns){const match=html.match(pattern);if(match)return text(match[1])}return""};

export async function POST(request:Request){
  try{
    const body=await request.json();
    const url=await assertPublicUrl(body.url);
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
    const response=await fetchPublic(url.toString(),controller.signal);clearTimeout(timeout);
    if(!response.ok)return NextResponse.json({error:"Източникът не отговори успешно."},{status:400});
    const html=(await response.text()).slice(0,2_000_000);
    if(body.type==="rss"){
      const blocks=[...html.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0,50).map(match=>match[2]);
      const items=blocks.map(block=>({title:tag(block,"title")||"Без заглавие",summary:tag(block,"description")||tag(block,"summary")||tag(block,"content"),url:tag(block,"link")||(block.match(/<link[^>]+href=["']([^"']+)/i)?.[1]||""),date:tag(block,"pubDate")||tag(block,"published")||tag(block,"updated")}));
      return NextResponse.json({items});
    }
    return NextResponse.json({title:meta(html,"og:title")||tag(html,"title")||url.hostname,summary:meta(html,"og:description")||meta(html,"description"),image:meta(html,"og:image"),url:response.url});
  }catch{return NextResponse.json({error:"Адресът не може да бъде обработен."},{status:400})}
}
