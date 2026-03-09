Run npm run build

> lifeos@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 3 modules transformed.
x Build failed in 88ms
error during build:
[vite:esbuild] Transform failed with 5 errors:
/home/runner/work/lifeos/lifeos/src/LifeOS.jsx:496:93: ERROR: Cannot use "||" with "??" without parentheses
/home/runner/work/lifeos/lifeos/src/LifeOS.jsx:829:80: ERROR: Cannot use "||" with "??" without parentheses
/home/runner/work/lifeos/lifeos/src/LifeOS.jsx:1438:78: ERROR: Cannot use "||" with "??" without parentheses
/home/runner/work/lifeos/lifeos/src/LifeOS.jsx:1546:80: ERROR: Cannot use "||" with "??" without parentheses
/home/runner/work/lifeos/lifeos/src/LifeOS.jsx:1913:80: ERROR: Cannot use "||" with "??" without parentheses
file: /home/runner/work/lifeos/lifeos/src/LifeOS.jsx:496:93

Cannot use "||" with "??" without parentheses
494|    const monthExp = useMemo(()=>expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0),[expenses,thisMonth]);
495|    const monthInc = useMemo(()=>incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0),[incomes,thisMonth]);
496|    const invVal   = useMemo(()=>investments.reduce((s,i)=>s+(Number(i.currentPrice??i.buyPrice||0))*Number(i.quantity||0),0),[investments]);
   |                                                                                               ^
497|    const assetVal = useMemo(()=>assets.reduce((s,a)=>s+Number(a.value||0),0),[assets]);
498|    const debtVal  = useMemo(()=>debts.reduce((s,d)=>s+Number(d.balance||0),0),[debts]);

Cannot use "||" with "??" without parentheses
827|    const monthExp = expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
828|    const monthInc = incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
829|    const invVal   = investments.reduce((s,i)=>s+Number(i.currentPrice??i.buyPrice||0)*Number(i.quantity||0),0);
   |                                                                                  ^
830|    const assetVal = assets.reduce((s,a)=>s+Number(a.value||0),0);
831|    const debtVal  = debts.reduce((s,d)=>s+Number(d.balance||0),0);

Cannot use "||" with "??" without parentheses
1436|      const mInc=incomes.filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0);
1437|      const mExp=expenses.filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0);
1438|      const invVal=investments.reduce((s,i)=>s+Number(i.currentPrice??i.buyPrice||0)*Number(i.quantity||0),0);
   |                                                                                ^
1439|      const nw=assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0);
1440|      const sr=mInc>0?((mInc-mExp)/mInc*100).toFixed(1):0;

Cannot use "||" with "??" without parentheses
1544|    const monthInc = incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
1545|    const savRate  = monthInc>0?((monthInc-monthExp)/monthInc)*100:0;
1546|    const invVal   = investments.reduce((s,i)=>s+Number(i.currentPrice??i.buyPrice||0)*Number(i.quantity||0),0);
   |                                                                                  ^
1547|    const nw       = assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0);
1548|  

Cannot use "||" with "??" without parentheses
1911|    const monthInc = incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
1912|    const monthExp = expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
1913|    const invVal   = investments.reduce((s,i)=>s+Number(i.currentPrice??i.buyPrice||0)*Number(i.quantity||0),0);
   |                                                                                  ^
1914|    const nw       = assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0);
1915|    const savRate  = monthInc>0?((monthInc-monthExp)/monthInc)*100:0;

    at failureErrorWithLog (/home/runner/work/lifeos/lifeos/node_modules/esbuild/lib/main.js:1472:15)
    at /home/runner/work/lifeos/lifeos/node_modules/esbuild/lib/main.js:755:50
    at responseCallbacks.<computed> (/home/runner/work/lifeos/lifeos/node_modules/esbuild/lib/main.js:622:9)
    at handleIncomingPacket (/home/runner/work/lifeos/lifeos/node_modules/esbuild/lib/main.js:677:12)
    at Socket.readFromStdout (/home/runner/work/lifeos/lifeos/node_modules/esbuild/lib/main.js:600:7)
    at Socket.emit (node:events:524:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:191:23)
Error: Process completed with exit code 1.
