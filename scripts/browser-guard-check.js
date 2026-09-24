async(page)=>{
  const assert=(v,m)=>{if(!v)throw Error(m);};
  const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oneflow-demo-v1')));
  const click=async(name)=>{await page.getByRole('button',{name,exact:true}).click();await page.locator('main').ariaSnapshot();};
  await page.locator('main').ariaSnapshot();
  await click('我的');await page.getByRole('button',{name:/^智能热水器/}).click();await page.getByRole('checkbox',{name:'设备在线状态',exact:true}).uncheck();await click('关闭');
  await click('首页');await page.getByRole('button',{name:/02 家，比你先准备好/}).click();await click('开始规划');await click('查看归家计划');await click('确认归家计划');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('oneflow-demo-v1')).tasks[0].steps.some(s=>s.targetDeviceId==='car'&&s.status==='completed'));
  await click('推进模拟时间');await page.getByText('智能热水器连接失败，设备当前离线',{exact:true}).waitFor();
  await click('跳过此步骤');let s=await data();assert(s.tasks[0].steps.find(s=>s.targetDeviceId==='water').status==='cancelled','Skip failed');assert(s.tasks[0].steps.find(s=>s.targetDeviceId==='ac').status==='pending','Skip affected independent step');
  await click('推进模拟时间');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('oneflow-demo-v1')).tasks[0].steps.some(s=>s.targetDeviceId==='ac'&&s.status==='completed'));
  const devices=JSON.stringify((await data()).devices);await click('取消剩余步骤');s=await data();assert(s.tasks[0].status==='cancelled','Cancel failed');assert(s.tasks[0].steps.find(s=>s.targetDeviceId==='ac').status==='completed','Cancel erased completed record');assert(s.tasks[0].steps.find(s=>s.targetDeviceId==='light').status==='cancelled','Pending step not cancelled');assert(JSON.stringify(s.devices)===devices,'Cancel reverted devices');
  await page.getByRole('textbox',{name:'告诉 OneFlow 你的需求'}).fill('随便聊点别的');await click('发送');assert(await page.getByText(/当前演示支持电影之夜/).isVisible(),'Missing unknown input feedback');
  await click('首页');await click('模拟语音输入');await page.getByRole('button',{name:'🏞️ 周末轻旅行',exact:true}).click();assert((await page.getByRole('textbox',{name:'告诉 OneFlow 你的需求'}).inputValue()).includes('1500'),'Voice simulation missing');
  const errors=[];const onError=e=>errors.push(String(e));page.on('pageerror',onError);await page.reload();await page.getByRole('heading',{name:/晚上好|下午好|早上好/}).waitFor();await page.getByRole('button',{name:'我的',exact:true}).click();page.off('pageerror',onError);assert(errors.length===0,errors.join(';'));
  await click('重置演示数据');await click('确认重置');s=await data();assert(s.tasks.length===2&&s.devices.find(d=>d.id==='water').online,'Reset failed');
  await page.setViewportSize({width:1440,height:1080});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'output/playwright/desktop-home.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'output/playwright/mobile-home.png',fullPage:true});
  return 'PASS: skip independence, cancellation preserves executed operations, unknown input, voice simulation, reset, no runtime page errors';
}
