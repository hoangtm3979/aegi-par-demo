const exposureLabels={payment:'Đã chuyển tiền',credential:'Đã đọc/gửi mã hoặc mật khẩu cho người khác',control:'Đã cho người khác truy cập tài khoản hoặc điều khiển thiết bị'};
const stateLabels={YES:'Đã làm',NO:'Chưa làm',UNKNOWN:'Chưa rõ',CONFLICT:'Thông tin mâu thuẫn'};
function interpretationHtml(r){
 const sem=r.understood?.semantic;if(!sem)return '';
 const qs=sem.clarifications||[];
 return `<section class="result-block" aria-label="Xác nhận cách hiểu"><h3>Kiểm tra lại PAR đã hiểu đúng chưa</h3><p>Đây là cách hiểu có giới hạn từ lời bạn mô tả, chưa được xác minh độc lập.</p>
 <ul>${Object.entries(sem.exposure||{}).map(([k,v])=>`<li>${escapeHtml(exposureLabels[k])}: <strong>${escapeHtml(stateLabels[v]||v)}</strong></li>`).join('')}</ul>
 ${qs.map(q=>q.id==='exposure'?`<form id="clarifyForm"><p>${escapeHtml(q.prompt)}</p>${q.fields.map(f=>`<p><label>${escapeHtml(f.label)} <select name="${escapeHtml(f.key)}" aria-label="${escapeHtml(f.label)}">${q.options.map(o=>`<option value="${o}" ${o===f.value?'selected':''}>${escapeHtml(stateLabels[o])}</option>`).join('')}</select></label></p>`).join('')}<button class="secondary" type="submit" ${submittedInput?'':'disabled'}>Cập nhật câu trả lời</button></form>`:`<p>${escapeHtml(q.prompt)}</p><button class="secondary" id="editDescription">Bổ sung mô tả</button>`).join('')}
 ${!submittedInput&&qs.length?'<p>Ca được mở lại không lưu mô tả gốc. Hãy nhập lại tình huống để kiểm tra tiếp.</p>':''}
 <p>Nếu câu trả lời trái với mô tả trước đó, PAR giữ cảnh báo và ghi nhận mâu thuẫn.</p></section>`;
}
function bindClarification(){
 $('#editDescription')?.addEventListener('click',()=>{show('#intake');$('#situation').focus();});
 $('#clarifyForm')?.addEventListener('submit',async e=>{
  e.preventDefault();if(!submittedInput)return;const b=e.submitter;b.disabled=true;
  const answers=Object.fromEntries(new FormData(e.target));
  try{
   const res=await fetch('/api/v1/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...submittedInput,exposure_answers:answers})});
   const data=await res.json();if(!res.ok)throw new Error('Không cập nhật được. Bạn có thể quay lại mô tả.');
   exposureAnswers=answers;submittedCaseId=data.case_id;lastResult=data;localStorage.setItem(LAST_CASE_KEY,data.case_id);renderResult(data);
  }catch(err){toast(err.message);b.disabled=false;}
 });
}
