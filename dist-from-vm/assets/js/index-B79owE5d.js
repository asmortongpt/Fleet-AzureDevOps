function t(t){let e=this||{},o=t.call?t(e.p):t;return f(o.unshift?o.raw?((t,e,o)=>t.reduce((t,a,r)=>{let i=e[r];if(i&&i.call){let t=i(o),e=t&&t.props&&t.props.className||/^go/.test(t)&&t;i=e?"."+e:t&&"object"==typeof t?t.props?"":p(t,""):!1===t?"":t}return t+a+(null==i?"":i)},""))(o,[].slice.call(arguments,1),e.p):o.reduce((t,o)=>Object.assign(t,o&&o.call?o(e.p):o),{}):o,n(e.target),e.g,e.o,e.k)}function e(e,o){let s=this||{};return function(){let o=arguments;return function n(l,d){let c=Object.assign({},l),p=c.className||n.className;s.p=Object.assign({theme:r&&r()},c),s.o=/ *go\d+/.test(p),c.className=t.apply(s,o)+(p?" "+p:"");let m=e;return e[0]&&(m=c.as||e,delete c.as),i&&m[0]&&i(c),a(m,c)}}}import{r as o}from"./react-core-hQu9tqS1.js";let a,r,i,s={data:""},n=t=>{if("object"==typeof window){let e=(t?t.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return e.nonce=window.__nonce__,e.parentNode||(t||document.head).appendChild(e),e.firstChild}return t||s},l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,c=/\n+/g,p=(t,e)=>{let o="",a="",r="";for(let i in t){let s=t[i];"@"==i[0]?"i"==i[1]?o=i+" "+s+";":a+="f"==i[1]?p(s,i):i+"{"+p(s,"k"==i[1]?"":e)+"}":"object"==typeof s?a+=p(s,e?e.replace(/([^,])+/g,t=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,e=>/&/.test(e)?e.replace(/&/g,t):t?t+" "+e:e)):i):null!=s&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),r+=p.p?p.p(i,s):i+":"+s+";")}return o+(e&&r?e+"{"+r+"}":r)+a},m={},u=t=>{if("object"==typeof t){let e="";for(let o in t)e+=o+u(t[o]);return e}return t},f=(t,e,o,a,r)=>{let i=u(t),s=m[i]||(m[i]=(t=>{let e=0,o=11;for(;t.length>e;)o=101*o+t.charCodeAt(e++)>>>0;return"go"+o})(i));if(!m[s]){let e=i!==t?t:(t=>{let e,o,a=[{}];for(;e=l.exec(t.replace(d,""));)e[4]?a.shift():e[3]?(o=e[3].replace(c," ").trim(),a.unshift(a[0][o]=a[0][o]||{})):a[0][e[1]]=e[2].replace(c," ").trim();return a[0]})(t);m[s]=p(r?{["@keyframes "+s]:e}:e,o?"":"."+s)}let n=o&&m.g?m.g:null;return o&&(m.g=m[s]),((t,e,o,a)=>{a?e.data=e.data.replace(a,t):-1===e.data.indexOf(t)&&(e.data=o?t+e.data:e.data+t)})(m[s],e,a,n),s};t.bind({g:1});let g=t.bind({k:1});var y=(t,e)=>(t=>"function"==typeof t)(t)?t(e):t,b=(()=>{let t=0;return()=>(++t).toString()})(),h=(()=>{let t;return()=>{if(void 0===t&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");t=!e||e.matches}return t}})(),x="default",v=(t,e)=>{let{toastLimit:o}=t.settings;switch(e.type){case 0:return{...t,toasts:[e.toast,...t.toasts].slice(0,o)};case 1:return{...t,toasts:t.toasts.map(t=>t.id===e.toast.id?{...t,...e.toast}:t)};case 2:let{toast:a}=e;return v(t,{type:t.toasts.find(t=>t.id===a.id)?1:0,toast:a});case 3:let{toastId:r}=e;return{...t,toasts:t.toasts.map(t=>t.id===r||void 0===r?{...t,dismissed:!0,visible:!1}:t)};case 4:return void 0===e.toastId?{...t,toasts:[]}:{...t,toasts:t.toasts.filter(t=>t.id!==e.toastId)};case 5:return{...t,pausedAt:e.time};case 6:let i=e.time-(t.pausedAt||0);return{...t,pausedAt:void 0,toasts:t.toasts.map(t=>({...t,pauseDuration:t.pauseDuration+i}))}}},w=[],$={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},j={},k=(t,e=x)=>{j[e]=v(j[e]||$,t),w.forEach(([t,o])=>{t===e&&o(j[e])})},E=t=>Object.keys(j).forEach(e=>k(t,e)),A=(t=x)=>e=>{k(e,t)},z=t=>(e,o)=>{let a=((t,e="blank",o)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:e,ariaProps:{role:"status","aria-live":"polite"},message:t,pauseDuration:0,...o,id:(null==o?void 0:o.id)||b()}))(e,t,o);return A(a.toasterId||(t=>Object.keys(j).find(e=>j[e].toasts.some(e=>e.id===t)))(a.id))({type:2,toast:a}),a.id},N=(t,e)=>z("blank")(t,e);N.error=z("error"),N.success=z("success"),N.loading=z("loading"),N.custom=z("custom"),N.dismiss=(t,e)=>{let o={type:3,toastId:t};e?A(e)(o):E(o)},N.dismissAll=t=>N.dismiss(void 0,t),N.remove=(t,e)=>{let o={type:4,toastId:t};e?A(e)(o):E(o)},N.removeAll=t=>N.remove(void 0,t),N.promise=(t,e,o)=>{let a=N.loading(e.loading,{...o,...null==o?void 0:o.loading});return"function"==typeof t&&(t=t()),t.then(t=>{let r=e.success?y(e.success,t):void 0;return r?N.success(r,{id:a,...o,...null==o?void 0:o.success}):N.dismiss(a),t}).catch(t=>{let r=e.error?y(e.error,t):void 0;r?N.error(r,{id:a,...o,...null==o?void 0:o.error}):N.dismiss(a)}),t};var O=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,_=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,I=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,F=e("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${O} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${_} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${t=>t.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${I} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,C=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,D=e("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${t=>t.secondary||"#e0e0e0"};
  border-right-color: ${t=>t.primary||"#616161"};
  animation: ${C} 1s linear infinite;
`,L=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,S=g`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,M=e("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${L} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${S} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${t=>t.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,P=e("div")`
  position: absolute;
`,T=e("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,q=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,H=e("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${q} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Z=({toast:t})=>{let{icon:e,type:a,iconTheme:r}=t;return void 0!==e?"string"==typeof e?o.createElement(H,null,e):e:"blank"===a?null:o.createElement(T,null,o.createElement(D,{...r}),"loading"!==a&&o.createElement(P,null,o.createElement("error"===a?F:M,{...r})))},B=t=>`\n0% {transform: translate3d(0,${-200*t}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,G=t=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*t}%,-1px) scale(.6); opacity:0;}\n`,J=e("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,K=e("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;o.memo(({toast:t,position:e,style:a,children:r})=>{let i=t.height?((t,e)=>{let o=t.includes("top")?1:-1,[a,r]=h()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[B(o),G(o)];return{animation:e?`${g(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(r)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(t.position||e||"top-center",t.visible):{opacity:0},s=o.createElement(Z,{toast:t}),n=o.createElement(K,{...t.ariaProps},y(t.message,t));return o.createElement(J,{className:t.className,style:{...i,...a,...t.style}},"function"==typeof r?r({icon:s,message:n}):o.createElement(o.Fragment,null,s,n))}),function(t){p.p=void 0,a=t,r=void 0,i=void 0}(o.createElement),t`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;export{N as n};
