$$('[data-entry]').forEach(btn=>btn.addEventListener('click',()=>{
  const mode=btn.dataset.entry; resetIntake(); show('#intake');
  if(mode==='quick') $('#situation').placeholder='Ví dụ: Số này gọi tự xưng ngân hàng và yêu cầu tôi chuyển tiền để xác minh...';
  if(mode==='recovery') { $('#actionState').value='UNKNOWN'; $('#situation').placeholder='Bạn đã chuyển tiền, đọc/gửi mã hay cho người khác truy cập thiết bị? Mô tả riêng từng việc; không nhập mã hoặc mật khẩu.'; }
}));
$$('[data-back]').forEach(btn=>btn.addEventListener('click',()=>show('#home')));

function updateTray(){
  $('#trayPhone').classList.toggle('active',!!$('#phone').value.trim());
  $('#trayAccount').classList.toggle('active',!!$('#account').value.trim());
  $('#trayQr').classList.toggle('active',lastAttachment?.kind==='QR_IMAGE');
  $('#trayImage').classList.toggle('active',!!lastAttachment);
}
function updateCount(){ $('#charCount').textContent=$('#situation').value.length; }
['phone','account'].forEach(id=>$('#'+id).addEventListener('input',updateTray));
$('#situation').addEventListener('input',()=>{updateCount(); exposureAnswers={}; submittedInput=null;});
['phone','account','actionState'].forEach(id=>$('#'+id).addEventListener('change',()=>{exposureAnswers={};submittedInput=null;}));

$('#evidenceFile').addEventListener('change', async()=>{
  const file=$('#evidenceFile').files?.[0]; if(!file){clearAttachment(); return;}
  const epoch=++uploadEpoch; uploading=true; attachmentTokens=[]; lastAttachment=null; updateTray(); $('#checkForm button[type=submit]').disabled=true;
  const status=$('#uploadStatus'); status.hidden=false; status.className='upload-status'; status.textContent='Đang gửi ảnh đến máy chủ demo để kiểm tra…';
  const fd=new FormData(); fd.append('file',file);
  try{
    const res=await fetch('/api/v1/uploads/image',{method:'POST',body:fd});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.detail||'Không thể tiếp nhận ảnh');
    if(epoch!==uploadEpoch)return;
    lastAttachment=data.attachment; attachmentTokens=[data.attachment.attachment_token];
    status.classList.add(lastAttachment.state==='QR_DECODED'?'good':'warn');
    status.innerHTML=lastAttachment.state==='QR_DECODED'
      ? `<strong>Đã đọc mã QR.</strong> Loại nội dung: ${escapeHtml(lastAttachment.qr_payload_type||'UNKNOWN')}. Ảnh gốc không được lưu trong kho kết quả.`
      : `<strong>Ảnh đã tiếp nhận.</strong> ${escapeHtml(lastAttachment.width)}×${escapeHtml(lastAttachment.height)} · mã ảnh ${escapeHtml(lastAttachment.sha256.slice(0,12))}… · chưa đọc chữ trong ảnh · ảnh gốc không được lưu trong kho kết quả.`;
    updateTray();
  }catch(err){ if(epoch!==uploadEpoch)return; attachmentTokens=[]; lastAttachment=null; status.classList.add('bad'); status.textContent=err.message||'Không thể tiếp nhận ảnh'; updateTray(); }finally{if(epoch===uploadEpoch){uploading=false;$('#checkForm button[type=submit]').disabled=false;}}
});

$('#checkForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  if(uploading){toast('Vui lòng chờ kiểm tra ảnh hoàn tất.');return;}
  const epoch=caseEpoch;
  const input={situation:$('#situation').value,phone:$('#phone').value||null,account:$('#account').value||null,action_state:$('#actionState').value,attachment_tokens:[...attachmentTokens],exposure_answers:{...exposureAnswers}};
  const button=e.submitter; button.disabled=true; button.textContent='Đang đối chiếu…';
  try{
    const res=await fetch('/api/v1/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.detail||'Không thể xử lý yêu cầu');
    submittedInput=input;
    if(epoch!==caseEpoch)return;
    submittedCaseId=data.case_id; lastResult=data; localStorage.setItem(LAST_CASE_KEY,lastResult.case_id); renderResult(lastResult); show('#result'); updateResumeCard();
  }catch(err){ toast(err.message||'Có lỗi xảy ra'); }
  finally{button.disabled=false; button.textContent='Kiểm tra tình huống';}
});
