// DEZE CODE IS TOEGEVOEGD ALS VOORBEELD EN ISS GEEN PRODUCTIE CODE
// cODE IS VERKREGEN VANUIT DE PAGINABRON VAN https://www.eat.lth.se/fileadmin/eat/Termisk_miljoe/IREQ2009ver4_2.html



//  Developed by Ingvar Holmer and Hakan O. Nilsson, 1990.
//  Altered by Hakan O. Nilsson and Ingvar Holmer, 1992.
//  Javascript original by Tomas Morales & Pilar Armenderiz, 1998.
//  Modified content and code by Hakan O. Nilsson and Ingvar Holmer, 2000-2002.

function calcIREQ(form) {
  var M,Ta,Tr,p,w,v,rh,Tsk,wetness,Tex,Pex,
  Psks,fcl,W,vp,Icl,Iclr,Pa,Tcl,hc,hr,
  IREQ,Ia,Rt,factor,Balance,R,C,Hres,
  E,S,DLE,ArAdu,IclCorr,slask,worktype,calculation,
  message,IREQneutral,IREQminimal,DLEneutral,DLEminimal = 1;
  M = eval(form.M.value); W = eval(form.W.value);
  Ta = eval(form.Ta.value); Tr = eval(form.Tr.value);
  p = eval(form.p.value); w = eval(form.w.value);
  v = eval(form.v.value); rh = eval(form.rh.value);
  Icl = eval(form.Icl.value);
  form.message.value="CALCULATION IN PROGRESS!";
  if (M<=58) {
    M=58; form.M.value=M;
  }
  if (M>=400) {
    M=400
  ; form.M.value=M;
  }
  if (Ta>=10) {
    Ta=10; form.Ta.value=Ta;
  }
  // Calculation of stationary w (m/s)
  if (w<=0.0052*(M-58)) {
    w=0.0052*(M-58); form.w.value=Math.round(w*10)/10;
  }  
  if (w>=1.2) {
    w=1.2; form.w.value=1.2;
  }
  if (v<=0.4) {
    v=0.4; form.v.value=v;
  }
  if (v>=18) {
    v=18; form.v.value=v;
  }
  Icl=Icl*0.155;
  Ia=0.092*Math.exp(-0.15*v-0.22*w)-0.0045;
  calculation=0; 
  do {
    calculation=calculation+1;
    // Calculation of Tsk (C) and wetness (%) 
    if (calculation==1) {
      // For IREQminimal, DLEminimal ! 
      Tsk=33.34-0.0354*M;
      wetness=0.06;
    }
           else  {
      // For IREQneutral, DLEneutral ! 
      Tsk=35.7-0.0285*M;
      wetness=0.001*M;
     }
    // Calculation of Tex (C) and Pex,Psks,Pa (Pa) 
    Tex=29+0.2*Ta;                     
    Pex=0.1333*Math.exp(18.6686-4030.183/(Tex+235));
    Psks=0.1333*Math.exp(18.6686-4030.183/(Tsk+235)); 
    Pa=(rh/100)*0.1333*Math.exp(18.6686-4030.183/(Ta+235));
    // Calculation of IREQ (m2C/W),Rt (m2kPa/W),fcl (n.d.),hr W/m2C with stepwise iteration 
    IREQ=0.5; hr=3; ArAdu=0.77; factor=0.5; // Initial values ! 
    do {
      fcl=1+1.197*IREQ;        
      Rt=(0.06/0.38)*(Ia+IREQ);
      E=wetness*(Psks-Pa)/Rt;
      Hres=1.73E-2*M*(Pex-Pa)+1.4E-3*M*(Tex-Ta);      
      Tcl=Tsk-IREQ*(M-W-E-Hres);
      hr=5.67E-8*0.95*ArAdu*(Math.exp(4*Math.log(273+Tcl))-
      Math.exp(4*Math.log(273+Tr)))/(Tcl-Tr);
      hc=1/Ia-hr;
      R=fcl*hr*(Tcl-Tr);
      C=fcl*hc*(Tcl-Ta);
      Balance=M-W-E-Hres-R-C;
      if (Balance>0)  {
        IREQ=IREQ-factor;
        factor=factor/2;
      }
      else {
        IREQ=IREQ+factor;         
      }

    } while (Math.abs(Balance) > 0.01); 
    IREQ=(Tsk-Tcl)/(R+C);

    // *** Calculation of Dlimneutral and Dlimminimal *** 
    // Calculation of S (W/m2), Rt (m2kPa/W), fcl (n.d.), hr W/m2C with stepwise iteration 
    Tcl=Ta; hr=3; S=-40; ArAdu=0.77; factor=500; Iclr=Icl; // Initial values !
    do {
      fcl=1+1.197*Iclr;
      Iclr=((Icl+0.085/fcl)*(0.54*Math.exp(-0.15*v-0.22*w)*Math.pow(p,0.075)-0.06*Math.log(p)+0.5)-
      (0.092*Math.exp(-0.15*v-0.22*w)-0.0045)/fcl);
      Rt=(0.06/0.38)*(Ia+Iclr);
      E=wetness*(Psks-Pa)/Rt;
      Hres=1.73E-2*M*(Pex-Pa)+1.4E-3*M*(Tex-Ta);
      Tcl=Tsk-Iclr*(M-W-E-Hres-S);      
      hr=5.67E-8*0.95*ArAdu*(Math.exp(4*Math.log(273+Tcl))-
      Math.exp(4*Math.log(273+Tr)))/(Tcl-Tr);
      hc=1/Ia-hr;
      R=fcl*hr*(Tcl-Tr);
      C=fcl*hc*(Tcl-Ta);
      Balance=M-W-E-Hres-R-C-S;  
      if (Balance>0)  {
        S=S+factor;
        factor=factor/2;
      }
      else {
        S=S-factor;
      }     
    } while (Math.abs(Balance) > 0.01);
    DLE=-40/S;
    form.message.value="CALCULATION READY!";
    if (calculation==1) {
      form.IREQminimal.value=Math.round((IREQ/0.155)*10)/10;
      form.ICLminimal.value=Math.round((((IREQ+Ia/fcl)/(0.54*Math.exp(-0.15*v-0.22*w)*
      Math.pow(p,0.075)-0.06*Math.log(p)+0.5))-0.085/fcl)/0.155*10)/10;
      if (S>-8)
        form.DLEminimal.value="more than 8"
      else
        form.DLEminimal.value=Math.round(DLE*10)/10
    }
    else  {
      form.IREQneutral.value=Math.round((IREQ/0.155)*10)/10;
      form.ICLneutral.value=Math.round((((IREQ+Ia/fcl)/(0.54*Math.exp(-0.15*v-0.22*w)*
      Math.pow(p,0.075)-0.06*Math.log(p)+0.5))-0.085/fcl)/0.155*10)/10;
      if (S>-8)
        form.DLEneutral.value="more than 8"
      else
        form.DLEneutral.value=Math.round(DLE*10)/10
      if (Icl/0.155>form.ICLneutral.value)
        form.message.value="AVAILABLE > REQUIRED MINIMAL & NEUTRAL basic clothing insulation";
    }
  } while (calculation < 2);
}

function calcRT(form) {
  var M,Ta,Tr,p,w,v,rh,Tsk,wetness,Tex,Pex,
  Psks,fcl,W,vp,Icl,Iclr,Pa,Tcl,hc,hr,
  IREQ,Ia,Rt,factor,Balance,R,C,Hres,
  E,S,DLE,ArAdu,IclCorr,slask,worktype,calculation,
  message,IREQneutral,IREQminimal,DLEneutral,DLEminimal = 1;
  M = eval(form.M.value); W = eval(form.W.value);
  Ta = eval(form.Ta.value); Tr = eval(form.Tr.value);
  p = eval(form.p.value); w = eval(form.w.value);
  v = eval(form.v.value); rh = eval(form.rh.value);
  Icl = eval(form.Icl.value);
  form.message.value="CALCULATION IN PROGRESS!";
  if (M<=58) {
    M=58; form.M.value=M;
  }
  if (M>=400) {
    M=400; form.M.value=M;
  }
  // Calculation of stationary w (m/s)
  if (w<=0.0052*(M-58)) {
    w=0.0052*(M-58);
    form.w.value=Math.round(w*10)/10;
  }  
  if (w>=1.2) {
    w=1.2; form.w.value=1.2;
  }
  if (v<=0.4) {
    v=0.4; form.v.value=v;
  }
  if (v>=18) {
    v=18; form.v.value=v;
  }
  Icl=Icl*0.155;
  Ia=(0.092*Math.exp(-0.15*v-0.22*w)-0.0045);
  calculation=0;
  do {
    calculation=calculation+1;
    // Calculation of Tsk (C) and wetness (%) 
    // For RTneutral! 
    Tsk=35.7-0.0285*M;
    wetness=0.001*M;
    // Calculation of Tex (C) and Pex,Psks,Pa (Pa) 
    Tex=29+0.2*Ta;                     
    Pex=0.1333*Math.exp(18.6686-4030.183/(Tex+235));
    Psks=0.1333*Math.exp(18.6686-4030.183/(Tsk+235)); 
    Pa=(rh/100)*0.1333*Math.exp(18.6686-4030.183/(Ta+235));  
    // Calculation of S (W/m2), Rt (m2kPa/W), fcl (n.d.), hr W/m2C with stepwise iteration 
    Tcl=Ta; hr=3; S=-40; ArAdu=0.77; factor=100; Iclr=Icl;// Initial values !          
    do {
      fcl=1+1.97*Iclr;
      Iclr=((Icl+0.085/fcl)*(0.54*Math.exp(-0.15*v-0.22*w)*Math.pow(p,0.075)-0.06*Math.log(p)+0.5)-
      (0.092*Math.exp(-0.15*v-0.22*w)-0.0045)/fcl);
      Rt=(0.06/0.38)*(Ia+Iclr);
      E=wetness*(Psks-Pa)/Rt;
      Hres=1.73E-2*M*(Pex-Pa)+1.4E-3*M*(Tex-Ta);
      Tcl=Tsk-Iclr*(M-W-E-Hres-S);      
      hr=5.67E-8*0.95*ArAdu*(Math.exp(4*Math.log(273+Tcl))-Math.exp(4*Math.log(273+Tr)))/(Tcl-Tr);
      hc=1/Ia-hr;
      R=fcl*hr*(Tcl-Tr);
      C=fcl*hc*(Tcl-Ta);
      Balance=M-W-E-Hres-R-C-S;  
      if (Balance>0)  {
        S=S+factor;
        factor=factor/2;
      }
      else {
        S=S-factor;         
      }     
    } while (Math.abs(Balance) > 0.01);
    DLE=-40/S;
    form.message.value="CALCULATION READY!";
    if (DLE>=0)
      form.message.value="CALCULATION INVALID! (Negative body heat storage)"
                 else
      form.RTneutral.value=Math.round(Math.abs(DLE)*10)/10
        } while (calculation<2)
}

function calctwc(form) {
  var v,Tawci,WCI,twc = 1;
  v = eval(form.v.value);
  v = v*1.0
  Tawci = eval(form.Tawci.value);
  twc = 13.12+0.6215*Tawci-11.37*Math.pow(v,0.16)+0.3965*Tawci* Math.pow(v,0.16);
  form.twc.value = Math.round(twc);
}

function interpret()
{
alert("Read the  standard, ISO 11079!");
}
