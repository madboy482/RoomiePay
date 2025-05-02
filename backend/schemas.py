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

class ExpenseResponse(ExpenseBase):
    ExpenseID: int
    Date: datetime
    IsSettled: bool
    PaidByUser: User
    
    class Config:
        from_attributes = True

class TimeFilterParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    period: Optional[str] = None  # "day", "week", "month", "year"

class SettlementBase(BaseModel):
    GroupID: int
    PayerUserID: int
    ReceiverUserID: int
    Amount: Decimal
    PaymentMethod: Optional[str] = None
    DueDate: Optional[datetime] = None

class SettlementCreate(SettlementBase):
    pass

class Settlement(SettlementBase):
    SettlementID: int
    Date: datetime
    Status: str

    class Config:
        from_attributes = True

class DetailedSettlement(BaseModel):
    SettlementID: int
    GroupID: int
    PayerUserID: int
    ReceiverUserID: int
    Amount: Decimal
    Status: str
    Date: datetime
    DueDate: datetime
    PaymentDate: Optional[datetime]
    PayerName: str
    ReceiverName: str
    GroupName: str

class SettlementSummary(BaseModel):
    Period: str
    TotalAmount: Decimal
    Settlements: List[Settlement]

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

class NotificationBase(BaseModel):
    UserID: int
    Message: str
    Type: str  # "SETTLEMENT_DUE", "PAYMENT_RECEIVED", etc.
    IsRead: bool = False

class Notification(NotificationBase):
    NotificationID: int
    CreatedAt: datetime
    
    class Config:
        from_attributes = True

class SettlementPeriod(BaseModel):
    GroupID: int
    Period: str  # "1h", "1d", "1w", "1m" for hour, day, week, month
    LastSettlement: Optional[datetime] = None
    NextSettlement: Optional[datetime] = None

class PaymentProcess(BaseModel):
    amount: Decimal