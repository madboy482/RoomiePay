from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text, inspect
from typing import List, Dict, Optional
import models, schemas
from security import get_current_user, get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from database import engine, get_db
import random
import string
from datetime import datetime, timedelta
from decimal import Decimal
import asyncio
import os
import re

# Create tables using SQL commands from cmds.txt
def create_tables_from_sql():
    try:
        # Read SQL commands from cmds.txt
        cmds_file_path = os.path.join(os.path.dirname(__file__), 'cmds.txt')
        with open(cmds_file_path, 'r') as file:
            sql_commands = file.read()
        
        # Check which tables already exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        print(f"Existing tables: {existing_tables}")
        
        # Split into individual commands and execute
        conn = engine.connect()
        commands = sql_commands.split(';')
        
        for command in commands:
            if command.strip():
                # Skip the CREATE DATABASE and USE commands as we've already set up the database connection
                if command.strip().startswith('CREATE DATABASE') or command.strip().startswith('USE'):
                    continue
                
                # Check if this is a CREATE TABLE command and extract the table name
                create_match = re.search(r'CREATE TABLE\s+(\w+)', command, re.IGNORECASE)
                if create_match:
                    table_name = create_match.group(1).lower()
                    # Skip if table already exists
                    if table_name in [t.lower() for t in existing_tables]:
                        print(f"Table '{table_name}' already exists, skipping creation")
                        continue
                
                # Execute the command
                try:
                    conn.execute(text(command))
                    print(f"Executed SQL: {command[:50]}...")
                except Exception as e:
                    print(f"Error executing SQL command: {e}")
        
        conn.commit()
        conn.close()
        print("Table creation process completed")
        
    except Exception as e:
        print(f"Error creating tables from SQL: {e}")
        # Fall back to SQLAlchemy metadata creation
        models.Base.metadata.create_all(bind=engine)
        print("Tables created using SQLAlchemy metadata")

# Create database tables
try:
    create_tables_from_sql()
except Exception as e:
    print(f"Error during table creation: {e}")
    # Fall back to SQLAlchemy metadata creation
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

# Add validation for period format
def validate_period_format(period: str) -> bool:
    if not period:
        return False
    if len(period) < 2:
        return False
    
    # Get the number and unit parts
    number = period[:-1]
    unit = period[-1]
    
    # Check if number is valid
    try:
        num = int(number)
        if num <= 0:
            return False
    except ValueError:
        return False
    
    # Check if unit is valid
    return unit in ['h', 'd', 'w', 'm']

# Authentication endpoints
@app.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.Email == user.Email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.Password)
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
    if not user or not verify_password(user_data.Password, user.Password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.Email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
):
    member_groups = db.query(models.UserGroup)\
        .join(models.GroupMember)\
        .filter(models.GroupMember.UserID == current_user.UserID)\
        .all()
    return member_groups

# Expense endpoints
@app.post("/expenses", response_model=schemas.ExpenseResponse)
async def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == expense.GroupID,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Use current_user's ID if PaidByUserID is not provided
    paid_by_user_id = expense.PaidByUserID if expense.PaidByUserID is not None else current_user.UserID
    
    # Verify the PaidByUserID is also a member of the group
    payer_member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == expense.GroupID,
            models.GroupMember.UserID == paid_by_user_id
        ).first()
    if not payer_member:
        raise HTTPException(status_code=400, detail="Payer must be a member of the group")
    
    db_expense = models.Expense(
        GroupID=expense.GroupID,
        PaidByUserID=paid_by_user_id,
        Amount=expense.Amount,
        Description=expense.Description,
        IsSettled=False
    )
    
    try:
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        
        # Get user details for the response
        paid_by_user = db.query(models.User)\
            .filter(models.User.UserID == db_expense.PaidByUserID)\
            .first()
            
        return {
            **db_expense.__dict__,
            "PaidByUser": paid_by_user
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/groups/{group_id}/expenses")
async def get_group_expenses(
    group_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    print(f"Getting expenses for group {group_id}, user: {current_user.UserID} ({current_user.Name})")
    
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Modified query to include user details in a single query, properly scoped to the group
    query = db.query(models.Expense, models.User)\
        .join(models.User, models.User.UserID == models.Expense.PaidByUserID)\
        .join(models.GroupMember, 
            (models.GroupMember.GroupID == models.Expense.GroupID) & 
            (models.GroupMember.UserID == models.User.UserID)
        )\
        .filter(
            models.Expense.GroupID == group_id,
            models.GroupMember.GroupID == group_id  # Ensure expenses are only from group members
        )\
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
    
    results = query.all()
    print(f"Found {len(results)} expenses")
    
    # Transform the results to include user details
    expenses = []
    for expense, user in results:
        expense_dict = {
            "ExpenseID": expense.ExpenseID,
            "GroupID": expense.GroupID,
            "PaidByUserID": expense.PaidByUserID,
            "Amount": expense.Amount,
            "Description": expense.Description,
            "Date": expense.Date,
            "IsSettled": expense.IsSettled,
            "PaidByUser": {
                "UserID": user.UserID,
                "Name": user.Name,
                "Email": user.Email,
                "Phone": user.Phone
            }
        }
        print(f"Expense {expense.ExpenseID}: {expense.Amount} paid by {user.Name} ({user.UserID})")
        expenses.append(expense_dict)
    
    return expenses

@app.get("/groups/{group_id}/balances", response_model=schemas.GroupBalance)
async def get_group_balances(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    group = db.query(models.UserGroup)\
        .join(models.GroupMember)\
        .filter(
            models.UserGroup.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get all members of THIS group only
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
    
    # Calculate what each person paid ONLY for this group
    paid_amounts = db.query(
        models.Expense.PaidByUserID,
        func.sum(models.Expense.Amount).label('total_paid')
    ).join(
        models.GroupMember,
        (models.GroupMember.GroupID == models.Expense.GroupID) &
        (models.GroupMember.UserID == models.Expense.PaidByUserID)
    ).filter(
        models.Expense.GroupID == group_id,
        models.GroupMember.GroupID == group_id  # Additional check to ensure expenses are from group members
    ).group_by(models.Expense.PaidByUserID).all()
    
    # Convert all amounts to Decimal for consistency
    total_expenses = sum((Decimal(str(amount)) for _, amount in paid_amounts), Decimal('0'))
    share_per_person = total_expenses / Decimal(str(len(members))) if members else Decimal('0')
    
    print(f"Total expenses: {total_expenses}, Share per person: {share_per_person}")
    
    # Initialize base balances - what they paid and their share
    for user_id, amount_paid in paid_amounts:
        amount_paid = Decimal(str(amount_paid))
        member_balances[user_id]["IsOwedAmount"] = amount_paid
        member_balances[user_id]["NetBalance"] = amount_paid - share_per_person
        
        print(f"User {user_id} paid {amount_paid}, balance: {member_balances[user_id]['NetBalance']}")
    
    # Make sure everyone who hasn't paid anything still has their share calculated
    for member_id in member_balances:
        if member_id not in [user_id for user_id, _ in paid_amounts]:
            member_balances[member_id]["NetBalance"] = -share_per_person
            print(f"User {member_id} paid nothing, balance: {member_balances[member_id]['NetBalance']}")
    
    # Update balances based on settlements (confirmed payments)
    confirmed_settlements = db.query(models.Settlement)\
        .filter(
            models.Settlement.GroupID == group_id,
            models.Settlement.Status == "Confirmed"
        ).all()
    
    print(f"Found {len(confirmed_settlements)} confirmed settlements for group {group_id}")
    
    for settlement in confirmed_settlements:
        payer_id = settlement.PayerUserID
        receiver_id = settlement.ReceiverUserID
        amount = Decimal(str(settlement.Amount))
        
        print(f"Settlement: {payer_id} paid {amount} to {receiver_id}")
        
        # Adjust balances for payer and receiver
        if payer_id in member_balances:
            member_balances[payer_id]["NetBalance"] += amount
            print(f"After settlement, payer {payer_id} balance: {member_balances[payer_id]['NetBalance']}")
            
        if receiver_id in member_balances:
            member_balances[receiver_id]["NetBalance"] -= amount
            print(f"After settlement, receiver {receiver_id} balance: {member_balances[receiver_id]['NetBalance']}")
    
    # Now calculate OwesAmount and IsOwedAmount based on the final NetBalance
    for member_id, balance_data in member_balances.items():
        # Reset these values to recalculate them properly
        balance_data["OwesAmount"] = Decimal("0")
        balance_data["IsOwedAmount"] = Decimal("0")
        
        # If NetBalance is negative, they owe money
        if balance_data["NetBalance"] < 0:
            balance_data["OwesAmount"] = abs(balance_data["NetBalance"])
        
        # The IsOwedAmount should be what they paid (their contribution)
        paid_amount = Decimal("0")
        for user_id, amount in paid_amounts:
            if user_id == member_id:
                paid_amount = Decimal(str(amount))
                break
        
        balance_data["IsOwedAmount"] = paid_amount
        
        print(f"Final for user {member_id}: Net={balance_data['NetBalance']}, " +
              f"Owes={balance_data['OwesAmount']}, IsOwed={balance_data['IsOwedAmount']}")
    
    return schemas.GroupBalance(
        GroupID=group_id,
        GroupName=group.GroupName,
        Members=list(member_balances.values())
    )

@app.post("/expenses/split", response_model=schemas.Expense)
async def create_split_expense(
    expense: schemas.SplitExpense,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    print(f"Creating split expense: {expense.model_dump()}")
    print(f"Current user: {current_user.UserID} ({current_user.Name})")
    
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == expense.GroupID,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    print(f"User {current_user.Name} is member of group {expense.GroupID}")
    
    # Get total number of group members for equal split
    member_count = db.query(models.GroupMember)\
        .filter(models.GroupMember.GroupID == expense.GroupID)\
        .count()
    
    if not member_count:
        raise HTTPException(status_code=400, detail="No members in group")
    
    print(f"Group has {member_count} members")
    
    # Create the expense with the provided PaidByUserID
    db_expense = models.Expense(
        GroupID=expense.GroupID,
        PaidByUserID=expense.PaidByUserID,  # Use the provided PaidByUserID
        Amount=expense.Amount,
        Description=expense.Description
    )
    print(f"Creating expense with PaidByUserID: {db_expense.PaidByUserID}")
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Create settlements based on split type
    if expense.SplitType == "EQUAL":
        share_amount = expense.Amount / member_count
        print(f"Equal split: {share_amount} per member")
        members = db.query(models.GroupMember)\
            .filter(models.GroupMember.GroupID == expense.GroupID)\
            .all()
        
        for member in members:
            if member.UserID != db_expense.PaidByUserID:  # Compare with the expense's PaidByUserID
                settlement = models.Settlement(
                    GroupID=expense.GroupID,
                    PayerUserID=member.UserID,
                    ReceiverUserID=db_expense.PaidByUserID,
                    Amount=share_amount
                )
                db.add(settlement)
                print(f"Created settlement: {member.UserID} pays {share_amount} to {db_expense.PaidByUserID}")
    
    elif expense.SplitType == "PERCENTAGE" and expense.Splits:
        total_percentage = sum(expense.Splits.values())
        if abs(total_percentage - 100.0) > 0.01:
            raise HTTPException(status_code=400, detail="Split percentages must sum to 100")
            
        for user_id, percentage in expense.Splits.items():
            if user_id != db_expense.PaidByUserID:
                amount = expense.Amount * (percentage / 100.0)
                settlement = models.Settlement(
                    GroupID=expense.GroupID,
                    PayerUserID=user_id,
                    ReceiverUserID=db_expense.PaidByUserID,
                    Amount=amount
                )
                db.add(settlement)
                print(f"Created percentage settlement: {user_id} pays {amount} to {db_expense.PaidByUserID}")
    
    db.commit()
    return db_expense

@app.get("/users/{user_id}/pending_settlements", response_model=List[schemas.DetailedSettlement])
async def get_pending_settlements(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_id != current_user.UserID:
        raise HTTPException(status_code=403, detail="Can only view your own settlements")
    
    settlements = db.query(models.Settlement)\
        .join(models.User, models.User.UserID == models.Settlement.PayerUserID)\
        .add_columns(models.User.Name.label('PayerName'))\
        .join(models.User, models.User.UserID == models.Settlement.ReceiverUserID, isouter=True)\
        .add_columns(models.User.Name.label('ReceiverName'))\
        .filter(
            (models.Settlement.PayerUserID == user_id) | 
            (models.Settlement.ReceiverUserID == user_id),
            models.Settlement.Status == "Pending"
        ).all()
    
    # Convert to DetailedSettlement objects
    detailed_settlements = []
    for settlement_tuple in settlements:
        settlement, payer_name, receiver_name = settlement_tuple
        detailed = schemas.DetailedSettlement(
            **{k: v for k, v in settlement.__dict__.items() if not k.startswith('_')},
            PayerName=payer_name,
            ReceiverName=receiver_name
        )
        detailed_settlements.append(detailed)
    
    return detailed_settlements

# Settlement endpoints
@app.post("/settlements", response_model=schemas.Settlement)
async def create_settlement(
    settlement: schemas.SettlementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
):
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    query = db.query(models.Settlement).filter(models.Settlement.GroupID == group_id)
    
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

@app.get("/settlements/history", response_model=List[schemas.DetailedSettlement])
async def get_settlement_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get settlement history for the current user"""
    user_id = current_user.UserID
    
    # Get all settlements where the user is either payer or receiver
    settlements = db.query(models.Settlement)\
        .filter(
            (models.Settlement.PayerUserID == user_id) | 
            (models.Settlement.ReceiverUserID == user_id)
        ).all()
    
    # Get the names of all users involved in these settlements
    user_ids = set()
    for settlement in settlements:
        user_ids.add(settlement.PayerUserID)
        user_ids.add(settlement.ReceiverUserID)
    
    users = db.query(models.User)\
        .filter(models.User.UserID.in_(user_ids))\
        .all()
    
    user_map = {user.UserID: user.Name for user in users}
    
    # Get group information
    group_ids = set(settlement.GroupID for settlement in settlements)
    groups = db.query(models.UserGroup)\
        .filter(models.UserGroup.GroupID.in_(group_ids))\
        .all()
    
    group_map = {group.GroupID: group.GroupName for group in groups}
    
    # Build response with detailed settlements
    detailed_settlements = []
    for settlement in settlements:
        detailed = {
            **settlement.__dict__,
            "PayerName": user_map.get(settlement.PayerUserID, "Unknown"),
            "ReceiverName": user_map.get(settlement.ReceiverUserID, "Unknown"),
            "GroupName": group_map.get(settlement.GroupID, "Unknown")
        }
        # Remove SQLAlchemy state
        if "_sa_instance_state" in detailed:
            detailed.pop("_sa_instance_state")
            
        detailed_settlements.append(detailed)
    
    return detailed_settlements

@app.get("/groups/{group_id}/settlements", response_model=List[schemas.DetailedSettlement])
async def get_group_settlements(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all settlements for a specific group"""
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get all settlements for the group
    settlements = db.query(models.Settlement)\
        .filter(models.Settlement.GroupID == group_id)\
        .all()
    
    # Get all member names
    user_ids = set()
    for settlement in settlements:
        user_ids.add(settlement.PayerUserID)
        user_ids.add(settlement.ReceiverUserID)
    
    users = db.query(models.User)\
        .filter(models.User.UserID.in_(user_ids))\
        .all()
    
    user_map = {user.UserID: user.Name for user in users}
    
    # Build response with detailed settlements
    detailed_settlements = []
    for settlement in settlements:
        detailed = {
            **settlement.__dict__,
            "PayerName": user_map.get(settlement.PayerUserID, "Unknown"),
            "ReceiverName": user_map.get(settlement.ReceiverUserID, "Unknown"),
            "GroupName": "Group" # Already filtered by group_id
        }
        # Remove SQLAlchemy state
        if "_sa_instance_state" in detailed:
            detailed.pop("_sa_instance_state")
            
        detailed_settlements.append(detailed)
    
    return detailed_settlements

# Invitation endpoints
@app.post("/invitations", response_model=schemas.Invitation)
async def create_invitation(
    invitation: schemas.InvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"User {current_user.Name} (ID: {current_user.UserID}) attempting to join group with code {invite_code}")
        
        # Validate invite code format
        if not invite_code or len(invite_code) != 8:
            raise HTTPException(
                status_code=400, 
                detail="Invalid invite code format. Code should be 8 characters long."
            )

        # Find the group
        group = db.query(models.UserGroup)\
            .filter(models.UserGroup.InviteCode == invite_code)\
            .first()
        if not group:
            raise HTTPException(
                status_code=404, 
                detail="Invalid invite code. Group not found."
            )
        
        print(f"Found group: {group.GroupName} (ID: {group.GroupID})")
        
        # Check if user is already a member
        existing_member = db.query(models.GroupMember)\
            .filter(
                models.GroupMember.GroupID == group.GroupID,
                models.GroupMember.UserID == current_user.UserID
            ).first()
            
        if existing_member:
            print(f"User is already a member of this group")
            return {
                "message": "Already a member of this group",
                "GroupID": group.GroupID
            }
        
        # Create new member
        new_member = models.GroupMember(
            UserID=current_user.UserID,
            GroupID=group.GroupID,
            IsAdmin=False
        )
        db.add(new_member)
        
        try:
            db.commit()
            print(f"Successfully added user to group")
        except Exception as e:
            db.rollback()
            print(f"Failed to add user to group: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to join group: {str(e)}"
            )
            
        return {
            "message": "Successfully joined the group",
            "GroupID": group.GroupID
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error while joining group: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@app.post("/groups/{group_id}/settlement-period")
async def set_settlement_period(
    group_id: int,
    period: str,  # "1h", "1d", "1w", "1m"
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    
    # Validate period format
    if not validate_period_format(period):
        raise HTTPException(status_code=400, detail="Invalid period format. Use format like '1h', '1d', '1w', '1m'")
    
    try:
        # Calculate next settlement time
        now = datetime.utcnow()
        if period.endswith('h'):
            next_settlement = now + timedelta(hours(int(period[:-1])))
        elif period.endswith('d'):
            next_settlement = now + timedelta(days(int(period[:-1])))
        elif period.endswith('w'):
            next_settlement = now + timedelta(weeks=int(period[:-1]))
        elif period.endswith('m'):
            next_settlement = now + timedelta(days=int(period[:-1]) * 30)
        
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
        return {"message": f"Settlement period set to {period}", "next_settlement": next_settlement}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update settlement period: {str(e)}")

@app.get("/notifications", response_model=List[schemas.Notification])
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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

@app.post("/groups/{group_id}/finalize-splits", response_model=List[schemas.DetailedSettlement])
async def finalize_group_splits(
    group_id: int,
    request: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Calculate and create settlements for a group based on current balances.
    If include_all=True, return all potential settlements including ones not yet created.
    If force_create=True, create new settlements in the database.
    """
    print(f"Finalizing splits for group {group_id}, request: {request}")
    
    # Verify user is in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    include_all = request.get('include_all', False)
    force_create = request.get('force_create', False)
    
    # Get current balances (these already account for confirmed settlements)
    balances_response = await get_group_balances(group_id, db, current_user)
    members = balances_response.Members
    
    # Get group name
    group = db.query(models.UserGroup).filter(models.UserGroup.GroupID == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group_name = group.GroupName
    
    # Find members who owe money (negative balance) and who are owed money (positive balance)
    debtors = [m for m in members if m.NetBalance < 0]
    creditors = [m for m in members if m.NetBalance > 0]
    
    # Sort by amount (largest debt and credit first)
    debtors.sort(key=lambda x: x.NetBalance)  # Ascending: most negative first
    creditors.sort(key=lambda x: x.NetBalance, reverse=True)  # Descending: most positive first
    
    print(f"Debtors: {len(debtors)}, Creditors: {len(creditors)}")
    for d in debtors:
        print(f"Debtor: {d.Name} ({d.UserID}) owes ${abs(d.NetBalance)}")
    for c in creditors:
        print(f"Creditor: {c.Name} ({c.UserID}) is owed ${c.NetBalance}")
    
    # Create settlements
    settlements = []
    due_date = datetime.utcnow() + timedelta(days=7)  # Default due date is a week from now

    # Get ALL existing settlements for this group to avoid duplicates and consider confirmed ones
    existing_settlements = db.query(models.Settlement)\
        .filter(models.Settlement.GroupID == group_id)\
        .all()
    
    # Track existing settlement pairs (both pending and confirmed)
    existing_pairs = {}
    for settlement in existing_settlements:
        pair_key = (settlement.PayerUserID, settlement.ReceiverUserID)
        if pair_key not in existing_pairs:
            existing_pairs[pair_key] = []
        existing_pairs[pair_key].append({
            "status": settlement.Status,
            "amount": settlement.Amount,
            "settlement": settlement
        })
    
    # Track newly created settlements to avoid duplicates within this operation
    new_settlement_pairs = set()
    
    for debtor in debtors:
        remaining_debt = abs(debtor.NetBalance)
        
        # Skip if no debt
        if remaining_debt < 0.01:
            continue
            
        for creditor in creditors:
            if remaining_debt < 0.01:
                break
                
            # Skip if creditor has no credit left
            if creditor.NetBalance < 0.01:
                continue
                
            # Calculate how much can be settled
            amount = min(remaining_debt, creditor.NetBalance)
            
            if amount < 0.01:
                continue
            
            pair_key = (debtor.UserID, creditor.UserID)
            
            # Skip if there's already a confirmed settlement between these users from this operation
            if pair_key in new_settlement_pairs:
                print(f"Skipping duplicate settlement: {debtor.UserID} -> {creditor.UserID}")
                continue
            
            # Check for existing settlements between these users
            existing_pair_settlements = existing_pairs.get(pair_key, [])
            pending_settlement = None
            
            # Find if there's a pending settlement we could update
            for settlement_info in existing_pair_settlements:
                if settlement_info["status"] == "Pending":
                    pending_settlement = settlement_info["settlement"]
                    break
            
            # Create or update settlement
            settlement_data = {
                "GroupID": group_id,
                "PayerUserID": debtor.UserID,
                "ReceiverUserID": creditor.UserID,
                "Amount": amount,
                "DueDate": due_date,
                "Status": "Pending",
                "PayerName": debtor.Name,
                "ReceiverName": creditor.Name,
                "GroupName": group_name  # Add the required GroupName field
            }
            
            if force_create:
                if pending_settlement:
                    # Update existing pending settlement
                    pending_settlement.Amount = amount
                    pending_settlement.DueDate = due_date
                    db.commit()
                    db.refresh(pending_settlement)
                    
                    settlement_data["SettlementID"] = pending_settlement.SettlementID
                    settlement_data["Date"] = pending_settlement.Date
                else:
                    # Create new settlement in database
                    db_settlement = models.Settlement(
                        GroupID=group_id,
                        PayerUserID=debtor.UserID,
                        ReceiverUserID=creditor.UserID,
                        Amount=amount,
                        DueDate=due_date,
                        Status="Pending"
                    )
                    db.add(db_settlement)
                    db.commit()
                    db.refresh(db_settlement)
                    
                    settlement_data["SettlementID"] = db_settlement.SettlementID
                    settlement_data["Date"] = db_settlement.Date
                
                # Remember this pair to avoid duplicates
                new_settlement_pairs.add(pair_key)
                
            # Add to list of settlements to return
            settlements.append(schemas.DetailedSettlement(**settlement_data))
            
            # Update remaining amounts for next iterations
            remaining_debt -= amount
            creditor.NetBalance -= amount
    
    # If include_all flag is true, also include existing settlements
    if include_all:
        for settlement in existing_settlements:
            # Only include if we don't already have this settlement in our results
            skip = False
            for s in settlements:
                if (hasattr(s, 'SettlementID') and s.SettlementID == settlement.SettlementID):
                    skip = True
                    break
            
            if skip:
                continue
                
            # Get user names
            payer = db.query(models.User).filter(models.User.UserID == settlement.PayerUserID).first()
            receiver = db.query(models.User).filter(models.User.UserID == settlement.ReceiverUserID).first()
            
            settlement_data = {
                "SettlementID": settlement.SettlementID,
                "GroupID": settlement.GroupID,
                "PayerUserID": settlement.PayerUserID,
                "ReceiverUserID": settlement.ReceiverUserID,
                "Amount": settlement.Amount,
                "Date": settlement.Date,
                "DueDate": settlement.DueDate,
                "Status": settlement.Status,
                "PaymentMethod": settlement.PaymentMethod,
                "PaymentDate": settlement.PaymentDate,
                "PayerName": payer.Name if payer else "Unknown",
                "ReceiverName": receiver.Name if receiver else "Unknown",
                "GroupName": group_name  # Add the required GroupName field
            }
            
            settlements.append(schemas.DetailedSettlement(**settlement_data))
    
    return settlements

@app.post("/settlements/{settlement_id}/process-payment")
async def process_payment(
    settlement_id: int,
    payment_data: schemas.PaymentProcess,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get the settlement
    settlement = db.query(models.Settlement)\
        .filter(models.Settlement.SettlementID == settlement_id)\
        .first()
    
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    if settlement.Status == "Confirmed":
        raise HTTPException(status_code=400, detail="Settlement has already been confirmed")
    
    # Verify payment amount matches settlement amount
    if payment_data.amount != settlement.Amount:
        raise HTTPException(status_code=400, detail="Payment amount must match settlement amount")
    
    # Update settlement status
    settlement.Status = "Confirmed"
    settlement.PaymentDate = datetime.utcnow()
    
    # Create notification for receiver
    receiver = db.query(models.User)\
        .filter(models.User.UserID == settlement.ReceiverUserID)\
        .first()
        
    notification = models.Notification(
        UserID=settlement.ReceiverUserID,
        Message=f"Payment of ${settlement.Amount:.2f} has been received from {current_user.Name}",
        Type="PAYMENT_RECEIVED"
    )
    db.add(notification)
    
    db.commit()
    return {"message": "Payment processed successfully"}

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
                    period.NextSettlement = now + timedelta(hours(int(period.Period[:-1])))
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

@app.get("/groups/{group_id}/invite-code")
async def get_group_invite_code(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify user is admin in group
    member = db.query(models.GroupMember)\
        .filter(
            models.GroupMember.GroupID == group_id,
            models.GroupMember.UserID == current_user.UserID,
            models.GroupMember.IsAdmin == True
        ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Must be group admin to retrieve invite code")
    
    # Get the group
    group = db.query(models.UserGroup)\
        .filter(models.UserGroup.GroupID == group_id)\
        .first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return {"invite_code": group.InviteCode}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
