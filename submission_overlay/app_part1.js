const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let lastResult = null;
let exposureAnswers = {};
let submittedInput = null;
let submittedCaseId = null;
let profiles = [];
let attachmentTokens = [];
let lastAttachment = null;
let uploadEpoch=0, uploading=false, resumeResult=null, caseEpoch=0;
function resetIntake(){caseEpoch++; exposureAnswers={}; submittedInput=null; submittedCaseId=null; lastResult=null; $('#checkForm').reset(); clearAttachment(); updateCount(); $('#situation').placeholder='Mô tả yêu cầu bạn nhận được và việc bạn đã làm. Không nhập mã hoặc mật khẩu thật.';}
function safeUrl(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:'#';}catch{return '#';}}
const LAST_CASE_KEY = 'aegi_par_p3_last_case';

function show(id){ $$('.view').forEach(v=>v.classList.remove('active')); $(id).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function li(items){return (items||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');}
function concernClass(level){return level?.startsWith('HIGH')||level?.startsWith('URGENT')?'high':level==='VERIFY'?'verify':'neutral';}
function stateClass(state){
  if(['MATCH','REFERENCE_MATCH'].includes(state)) return 'state-good';
  if(['DEVIATION','SIMILAR_REVIEWED'].includes(state)) return 'state-warn';
  if(['UNAVAILABLE','STALE','CONFLICTED'].includes(state)) return 'state-neutral';
  return 'state-neutral';
}

async function loadProfiles(){
  const res = await fetch('/api/v1/demo/profiles');
  if(!res.ok) throw new Error('Chưa tải được tình huống mẫu. Bạn vẫn có thể nhập tình huống của mình.');
  const data = await res.json();
  const apiProfiles = data.profiles || [];
  const recoveryProfile = {
    id:'submission_recovery',
    label:'Tình huống 3 · Đã chuyển tiền — cần xử lý ngay',
    thesis:'Khi hành động đã xảy ra, PAR chuyển từ phòng ngừa sang hướng dẫn xử lý sau sự cố: liên hệ đơn vị quản lý tài khoản qua kênh tin cậy, bảo vệ tài khoản và giữ bằng chứng.',
    situation:'Tôi đã chuyển 25 triệu đồng theo yêu cầu của người gọi tự xưng cán bộ điều tra và họ yêu cầu tôi giữ bí mật. Sau đó tôi phát hiện tài khoản nhận không đúng thông tin mà họ nói. Tôi cần biết phải làm gì ngay.',
    phone:'0900000404', account:'666600001111222233', action_state:'ALREADY_TRANSFERRED'
  };
  profiles = [
    {...apiProfiles.find(p=>p.id==='hero1_unknown_identifier'), label:'Tình huống 1 · Yêu cầu chuyển tiền đáng ngờ', thesis:'Chưa tìm thấy cảnh báo về số điện thoại không có nghĩa là nên chuyển tiền theo yêu cầu.'},
    {...apiProfiles.find(p=>p.id==='hero2_legitimate_unfamiliar'), label:'Tình huống 2 · Thanh toán đã đối chiếu kênh chính thức', thesis:'Không khuyên dừng chỉ vì người nhận lạ. Việc đối chiếu thông tin vẫn không phải chứng nhận giao dịch an toàn.'},
    recoveryProfile
  ].filter(p=>p.id && p.situation);
  const labels=['01','02','03'];
  $('#proofGrid').innerHTML = profiles.map((p,i)=>`<article class="proof-card">
    <div class="proof-number">${labels[i]||String(i+1).padStart(2,'0')}</div>
    <div><span class="tag">${escapeHtml(p.label.split(' · ')[0])}</span><h3>${escapeHtml(p.label.split(' · ')[1]||p.label)}</h3><p>${escapeHtml(p.thesis)}</p></div>
    <button class="text-button load-profile" data-profile="${escapeHtml(p.id)}">Thử tình huống →</button>
  </article>`).join('');
  $$('.load-profile').forEach(b=>b.addEventListener('click',()=>loadProfile(b.dataset.profile)));
}

function clearAttachment(){
  uploadEpoch++; uploading=false; $('#checkForm button[type=submit]').disabled=false;
  attachmentTokens=[]; lastAttachment=null; $('#evidenceFile').value='';
  $('#uploadStatus').hidden=true; $('#uploadStatus').textContent='';
  updateTray();
}
function loadProfile(id){
  const p=profiles.find(x=>x.id===id); if(!p) return;
  resetIntake(); show('#intake');
  $('#situation').value=p.situation; $('#phone').value=p.phone||''; $('#account').value=p.account||''; $('#actionState').value=p.action_state||'UNKNOWN';
  updateTray(); updateCount(); toast(`Đã điền ${p.label}`);
}
