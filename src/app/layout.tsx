import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TipDirect",
  description: "Geef eenvoudig een tip via QR-code",
};

// Polyfills voor oude browsers (vóór 2021): React 19 vereist WeakRef,
// FinalizationRegistry en structuredClone. Zonder deze faalt hydration
// stil en zijn knoppen niet klikbaar.
const POLYFILLS = `
(function(){
  if(typeof WeakRef==='undefined'){
    self.WeakRef=function(t){this._t=t};
    self.WeakRef.prototype.deref=function(){return this._t};
  }
  if(typeof FinalizationRegistry==='undefined'){
    self.FinalizationRegistry=function(){};
    self.FinalizationRegistry.prototype.register=function(){};
    self.FinalizationRegistry.prototype.unregister=function(){};
  }
  if(typeof structuredClone==='undefined'){
    self.structuredClone=function(v){
      try{return JSON.parse(JSON.stringify(v))}catch(e){return v}
    };
  }
  if(!Array.prototype.at){
    Array.prototype.at=function(i){
      var n=Math.trunc(i)||0;
      if(n<0)n+=this.length;
      return(n<0||n>=this.length)?undefined:this[n];
    };
  }
  if(!Object.hasOwn){
    Object.hasOwn=function(o,p){
      return Object.prototype.hasOwnProperty.call(o,p);
    };
  }
  if(!Promise.allSettled){
    Promise.allSettled=function(ps){
      return Promise.all(ps.map(function(p){
        return Promise.resolve(p).then(
          function(v){return{status:'fulfilled',value:v}},
          function(r){return{status:'rejected',reason:r}}
        );
      }));
    };
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Polyfills moeten vóór elk ander script laden */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: POLYFILLS }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
