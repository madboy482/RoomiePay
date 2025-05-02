from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal

class UserBase(BaseModel):
    Name: str
    Email: EmailStr
    Phone: Optional[str] = None

class UserCreate(UserBase):
    Password: str

class UserLogin(BaseModel):
    Email: EmailStr
    Password: str

class User(UserBase):
    UserID: int
    JoinDate: datetime
    
    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    GroupName: str
    Description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class Group(GroupBase):
    GroupID: int
    CreationDate: datetime
    InviteCode: str
    CreatedByUserID: int

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    GroupID: int
    Amount: Decimal
    Description: str
    PaidByUserID: int

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    ExpenseID: int
    Date: datetime
    IsSettled: bool

    class Config:
        from_attributes = True

class SettlementBase(BaseModel):
    GroupID: int
    PayerUserID: int
    ReceiverUserID: int
    Amount: Decimal
    PaymentMethod: Optional[str] = None

class SettlementCreate(SettlementBase):
    pass

class Settlement(SettlementBase):
    SettlementID: int
    Date: datetime
    Status: str

    class Config:
        from_attributes = True

class InvitationBase(BaseModel):
    GroupID: int
    RecipientEmail: EmailStr
    ExpiryDate: Optional[datetime] = None

class InvitationCreate(InvitationBase):
    pass

class Invitation(InvitationBase):
    InvitationID: int
    SenderUserID: int
    Status: str
    InvitationDate: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class Balance(BaseModel):
    UserID: int
    Name: str
    OwesAmount: Decimal
    IsOwedAmount: Decimal
    NetBalance: Decimal

class GroupBalance(BaseModel):
    GroupID: int
    GroupName: str
    Members: List[Balance]

class SplitExpense(ExpenseCreate):
    SplitType: str = "EQUAL"  # EQUAL or PERCENTAGE
    Splits: Optional[Dict[int, float]] = None  # UserID to percentage/amount mapping