from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
import models, schemas, security
from database import engine, get_db
import random
import string
from datetime import datetime, timedelta
from decimal import Decimal
import asyncio

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

# Authentication endpoints
@app.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.Email == user.Email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user.Password)
    db_user = models.User(
        Name=user.Name,
        Email=user.Email,
        Password=hashed_password,
        Phone=user.Phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token")
async def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.Email == user_data.Email).first()
    if not user or not security.verify_password(user_data.Password, user.Password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(
        data={"sub": user.Email}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "UserID": user.UserID,
            "Name": user.Name,
            "Email": user.Email
        }
    }

# Group endpoints
@app.post("/groups", response_model=schemas.Group)
async def create_group(
    group: schemas.GroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_group = models.UserGroup(
        GroupName=group.GroupName,
        Description=group.Description,
        InviteCode=generate_invite_code(),
        CreatedByUserID=current_user.UserID
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add creator as admin member
    group_member = models.GroupMember(
        UserID=current_user.UserID,
        GroupID=db_group.GroupID,
        IsAdmin=True
    )
    db.add(group_member)
    db.commit()
    
    return db_group

@app.get("/groups", response_model=List[schemas.Group])
async def get_user_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    member_groups = db.query(models.UserGroup)\
        .join(models.GroupMember)\
        .filter(models.GroupMember.UserID == current_user.UserID)\
        .all()
    return member_groups

# Expense endpoints
@app.post("/expenses", response_model=schemas.Expense)
async def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == expense.GroupID,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/groups/{group_id}/expenses")
async def get_group_expenses(
    group_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    query = db.query(models.Expense)\
        .outerjoin(
            models.User,
            models.User.UserID == models.Expense.PaidByUserID
        )\
        .filter(models.Expense.GroupID == group_id)\
        .order_by(models.Expense.Date.desc())
    
    if start_date:
        query = query.filter(models.Expense.Date >= start_date)
    if end_date:
        query = query.filter(models.Expense.Date <= end_date)
    elif period:
        if period == "day":
            start_date = datetime.utcnow() - timedelta(days=1)
        elif period == "week":
            start_date = datetime.utcnow() - timedelta(weeks=1)
        elif period == "month":
            start_date = datetime.utcnow() - timedelta(days=30)
        elif period == "year":
            start_date = datetime.utcnow() - timedelta(days=365)
            
        if start_date:
            query = query.filter(models.Expense.Date >= start_date)
    
    expenses = query.all()
    
    # Add user details to each expense
    for expense in expenses:
        expense.PaidByUser = db.query(models.User)\
            .filter(models.User.UserID == expense.PaidByUserID)\
            .first()
    
    return expenses

@app.get("/groups/{group_id}/balances", response_model=schemas.GroupBalance)
async def get_group_balances(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get group info
    group = db.query(models.UserGroup).filter(models.UserGroup.GroupID == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get all members
    members = db.query(models.User)\
        .join(models.GroupMember)\
        .filter(models.GroupMember.GroupID == group_id)\
        .all()
    
    member_balances = {}
    for member in members:
        member_balances[member.UserID] = {
            "UserID": member.UserID,
            "Name": member.Name,
            "OwesAmount": Decimal("0"),
            "IsOwedAmount": Decimal("0"),
            "NetBalance": Decimal("0")
        }
    
    # Calculate what each person paid
    paid_amounts = db.query(
        models.Expense.PaidByUserID,
        func.sum(models.Expense.Amount).label('total_paid')
    ).filter(
        models.Expense.GroupID == group_id,
        models.Expense.IsSettled == False
    ).group_by(models.Expense.PaidByUserID).all()
    
    # Convert all amounts to Decimal for consistency
    total_expenses = sum((Decimal(str(amount)) for _, amount in paid_amounts), Decimal('0'))
    share_per_person = total_expenses / Decimal(str(len(members))) if members else Decimal('0')
    
    # Update balances based on payments made
    for user_id, amount_paid in paid_amounts:
        amount_paid = Decimal(str(amount_paid))
        member_balances[user_id]["IsOwedAmount"] = amount_paid
        member_balances[user_id]["NetBalance"] = amount_paid - share_per_person
    
    # Update balances based on what each person owes
    for member_id in member_balances:
        if member_balances[member_id]["NetBalance"] < 0:
            member_balances[member_id]["OwesAmount"] = abs(member_balances[member_id]["NetBalance"])
    
    return schemas.GroupBalance(
        GroupID=group_id,
        GroupName=group.GroupName,
        Members=list(member_balances.values())
    )

@app.post("/expenses/split", response_model=schemas.Expense)
async def create_split_expense(
    expense: schemas.SplitExpense,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == expense.GroupID,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get total number of group members for equal split
    member_count = db.query(models.GroupMember)\
        .filter(models.GroupMember.GroupID == expense.GroupID)\
        .count()
    
    if not member_count:
        raise HTTPException(status_code=400, detail="No members in group")
    
    # Create the expense
    db_expense = models.Expense(
        GroupID=expense.GroupID,
        PaidByUserID=expense.PaidByUserID,
        Amount=expense.Amount,
        Description=expense.Description
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Create settlements based on split type
    if expense.SplitType == "EQUAL":
        share_amount = expense.Amount / member_count
        members = db.query(models.GroupMember)\
            .filter(models.GroupMember.GroupID == expense.GroupID)\
            .all()
        
        for member in members:
            if member.UserID != expense.PaidByUserID:
                settlement = models.Settlement(
                    GroupID=expense.GroupID,
                    PayerUserID=member.UserID,
                    ReceiverUserID=expense.PaidByUserID,
                    Amount=share_amount
                )
                db.add(settlement)
    
    elif expense.SplitType == "PERCENTAGE" and expense.Splits:
        total_percentage = sum(expense.Splits.values())
        if abs(total_percentage - 100.0) > 0.01:  # Allow small floating point differences
            raise HTTPException(status_code=400, detail="Split percentages must sum to 100")
            
        for user_id, percentage in expense.Splits.items():
            if user_id != expense.PaidByUserID:
                amount = expense.Amount * (percentage / 100.0)
                settlement = models.Settlement(
                    GroupID=expense.GroupID,
                    PayerUserID=user_id,
                    ReceiverUserID=expense.PaidByUserID,
                    Amount=amount
                )
                db.add(settlement)
    
    db.commit()
    return db_expense

@app.get("/users/{user_id}/pending_settlements", response_model=List[schemas.Settlement])
async def get_pending_settlements(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if user_id != current_user.UserID:
        raise HTTPException(status_code=403, detail="Can only view your own settlements")
    
    settlements = db.query(models.Settlement)\
        .filter(
            (models.Settlement.PayerUserID == user_id) | 
            (models.Settlement.ReceiverUserID == user_id),
            models.Settlement.Status == "Pending"
        ).all()
    
    return settlements

# Settlement endpoints
@app.post("/settlements", response_model=schemas.Settlement)
async def create_settlement(
    settlement: schemas.SettlementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == settlement.GroupID,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    db_settlement = models.Settlement(**settlement.model_dump())
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

@app.put("/settlements/{settlement_id}/confirm")
async def confirm_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    settlement = db.query(models.Settlement)\
        .filter(models.Settlement.SettlementID == settlement_id)\
        .first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    if settlement.ReceiverUserID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Only the receiver can confirm the settlement")
    
    settlement.Status = "Confirmed"
    db.commit()
    return {"message": "Settlement confirmed successfully"}

@app.get("/groups/{group_id}/settlements/summary", response_model=schemas.SettlementSummary)
async def get_settlements_summary(
    group_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    query = db.query(models.Settlement).join(
        models.User,
        models.User.UserID == models.Settlement.PayerUserID
    ).filter(models.Settlement.GroupID == group_id)
    
    if start_date:
        query = query.filter(models.Settlement.Date >= start_date)
    if end_date:
        query = query.filter(models.Settlement.Date <= end_date)
    elif period:
        if period == "day":
            start_date = datetime.utcnow() - timedelta(days=1)
        elif period == "week":
            start_date = datetime.utcnow() - timedelta(weeks=1)
        elif period == "month":
            start_date = datetime.utcnow() - timedelta(days=30)
        elif period == "year":
            start_date = datetime.utcnow() - timedelta(days=365)
            
        if start_date:
            query = query.filter(models.Settlement.Date >= start_date)
    
    settlements = query.all()
    total_amount = sum(s.Amount for s in settlements)
    
    return schemas.SettlementSummary(
        Period=period or "custom",
        TotalAmount=total_amount,
        Settlements=settlements
    )

# Invitation endpoints
@app.post("/invitations", response_model=schemas.Invitation)
async def create_invitation(
    invitation: schemas.InvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is admin in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == invitation.GroupID,
            models.GroupMember.UserID == current_user.UserID,
            models.GroupMember.IsAdmin == True
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Must be group admin to send invitations")
    
    db_invitation = models.Invitation(
        **invitation.model_dump(),
        SenderUserID=current_user.UserID,
        ExpiryDate=datetime.utcnow() + timedelta(days=7)
    )
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    return db_invitation

@app.post("/groups/join/{invite_code}")
async def join_group(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    group = db.query(models.UserGroup)\
        .filter(models.UserGroup.InviteCode == invite_code)\
        .first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    existing_member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group.GroupID,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="Already a member of this group")
    
    new_member = models.GroupMember(
        UserID=current_user.UserID,
        GroupID=group.GroupID,
        IsAdmin=False
    )
    db.add(new_member)
    db.commit()
    return {"message": "Successfully joined the group"}

@app.post("/groups/{group_id}/settlement-period")
async def set_settlement_period(
    group_id: int,
    period: str,  # "1h", "1d", "1w", "1m"
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is admin in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID,
            models.GroupMember.IsAdmin == True
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Must be group admin to set settlement period")
    
    # Calculate next settlement time
    now = datetime.utcnow()
    if period.endswith('h'):
        next_settlement = now + timedelta(hours=int(period[:-1]))
    elif period.endswith('d'):
        next_settlement = now + timedelta(days=int(period[:-1]))
    elif period.endswith('w'):
        next_settlement = now + timedelta(weeks=int(period[:-1]))
    elif period.endswith('m'):
        next_settlement = now + timedelta(days=int(period[:-1]) * 30)
    else:
        raise HTTPException(status_code=400, detail="Invalid period format")
    
    db_period = db.query(models.SettlementPeriod)\
        .filter(models.SettlementPeriod.GroupID == group_id)\
        .first()
    
    if db_period:
        db_period.Period = period
        db_period.NextSettlement = next_settlement
    else:
        db_period = models.SettlementPeriod(
            GroupID=group_id,
            Period=period,
            NextSettlement=next_settlement
        )
        db.add(db_period)
    
    db.commit()
    return {"message": f"Settlement period set to {period}"}

@app.get("/notifications", response_model=List[schemas.Notification])
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    notifications = db.query(models.Notification)\
        .filter(
            models.Notification.UserID == current_user.UserID,
            models.Notification.IsRead == False
        ).all()
    return notifications

@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    notification = db.query(models.Notification)\
        .filter(
            models.Notification.NotificationID == notification_id,
            models.Notification.UserID == current_user.UserID
        ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.IsRead = True
    db.commit()
    return {"message": "Notification marked as read"}

@app.post("/groups/{group_id}/finalize-splits", response_model=List[schemas.Settlement])
async def finalize_group_splits(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify user is admin in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID,
            models.GroupMember.IsAdmin == True
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Must be group admin to finalize splits")
    
    # Get all unsettled expenses
    expenses = db.query(models.Expense)\
        .filter(
            models.Expense.GroupID == group_id,
            models.Expense.IsSettled == False
        ).all()
    
    if not expenses:
        raise HTTPException(status_code=400, detail="No unsettled expenses to finalize")
    
    # Get all members
    members = db.query(models.GroupMember)\
        .filter(models.GroupMember.GroupID == group_id)\
        .all()
    
    # Calculate total paid by each person
    total_paid = {}
    for expense in expenses:
        total_paid[expense.PaidByUserID] = total_paid.get(expense.PaidByUserID, Decimal('0')) + Decimal(str(expense.Amount))
    
    # Calculate equal share per person
    total_amount = sum(total_paid.values())
    share_per_person = total_amount / Decimal(str(len(members)))
    
    # Calculate net balances
    settlements = []
    net_balances = {m.UserID: total_paid.get(m.UserID, Decimal('0')) - share_per_person for m in members}
    
    # While there are unresolved balances
    while any(abs(bal) > Decimal('0.01') for bal in net_balances.values()):
        # Find max creditor and debtor
        max_debtor = max(net_balances.items(), key=lambda x: x[1] if x[1] < 0 else -Decimal('inf'))
        max_creditor = max(net_balances.items(), key=lambda x: x[1] if x[1] > 0 else -Decimal('inf'))
        
        # Calculate settlement amount
        amount = min(abs(max_debtor[1]), max_creditor[1])
        
        if amount > Decimal('0'):
            # Create settlement
            settlement = models.Settlement(
                GroupID=group_id,
                PayerUserID=max_debtor[0],
                ReceiverUserID=max_creditor[0],
                Amount=amount,
                Status='Pending',
                DueDate=datetime.utcnow() + timedelta(days=7)
            )
            db.add(settlement)
            settlements.append(settlement)
            
            # Update balances
            net_balances[max_debtor[0]] += amount
            net_balances[max_creditor[0]] -= amount
    
    # Mark all expenses as settled
    for expense in expenses:
        expense.IsSettled = True
    
    db.commit()
    return settlements

async def check_settlements(background_tasks: BackgroundTasks):
    while True:
        try:
            db = next(get_db())
            now = datetime.utcnow()
            
            # Find groups with due settlements
            due_periods = db.query(models.SettlementPeriod)\
                .filter(models.SettlementPeriod.NextSettlement <= now)\
                .all()
            
            for period in due_periods:
                # Get all unsettled expenses in the group
                expenses = db.query(models.Expense)\
                    .filter(
                        models.Expense.GroupID == period.GroupID,
                        models.Expense.IsSettled == False
                    ).all()
                
                if expenses:
                    # Calculate total expenses and shares
                    total_paid = {}  # who paid how much
                    for expense in expenses:
                        total_paid[expense.PaidByUserID] = total_paid.get(expense.PaidByUserID, 0) + expense.Amount
                    
                    # Get group members
                    members = db.query(models.GroupMember)\
                        .filter(models.GroupMember.GroupID == period.GroupID)\
                        .all()
                    
                    # Calculate equal share per person
                    total_amount = sum(total_paid.values())
                    share_per_person = total_amount / len(members)
                    
                    # Create settlements and notifications
                    for member in members:
                        amount_paid = total_paid.get(member.UserID, 0)
                        amount_owed = share_per_person - amount_paid
                        
                        if amount_owed > 0:  # This person needs to pay
                            # Find who to pay to (person who paid the most)
                            max_payer = max(total_paid.items(), key=lambda x: x[1])[0]
                            
                            # Create settlement
                            settlement = models.Settlement(
                                GroupID=period.GroupID,
                                PayerUserID=member.UserID,
                                ReceiverUserID=max_payer,
                                Amount=amount_owed,
                                Status='Pending',
                                DueDate=now + timedelta(days=7)  # 1 week to pay
                            )
                            db.add(settlement)
                            
                            # Create notification for the payer
                            notification = models.Notification(
                                UserID=member.UserID,
                                Message=f'You need to pay ${amount_owed:.2f} for group expenses',
                                Type='SETTLEMENT_DUE'
                            )
                            db.add(notification)
                    
                    # Mark expenses as settled
                    for expense in expenses:
                        expense.IsSettled = True
                
                # Update next settlement time based on period
                if period.Period.endswith('h'):
                    period.NextSettlement = now + timedelta(hours=int(period.Period[:-1]))
                elif period.Period.endswith('d'):
                    period.NextSettlement = now + timedelta(days=int(period.Period[:-1]))
                elif period.Period.endswith('w'):
                    period.NextSettlement = now + timedelta(weeks=int(period.Period[:-1]))
                elif period.Period.endswith('m'):
                    period.NextSettlement = now + timedelta(days=int(period.Period[:-1]) * 30)
                
                period.LastSettlement = now
            
            db.commit()
        except Exception as e:
            print(f"Error in settlement check: {e}")
        finally:
            db.close()
        
        await asyncio.sleep(60)  # Check every minute

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(check_settlements(BackgroundTasks()))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
