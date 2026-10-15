import{defineConfig}from'@playwright/test';
export default defineConfig({testDir:'./tests/browser',use:{baseURL:process.env.BASE_URL||'http://localhost:3000',headless:true},projects:[{name:'mobile',use:{viewport:{width:390,height:844}}},{name:'desktop',use:{viewport:{width:1440,height:1000}}}]});
