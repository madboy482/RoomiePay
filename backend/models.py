from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, Numeric
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "Users"
    
    UserID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String(100), nullable=False)
    Email = Column(String(100), unique=True, nullable=False, index=True)
    Password = Column(Text, nullable=False)
    Phone = Column(String(15))
    JoinDate = Column(DateTime, default=func.now())

class UserGroup(Base):
    __tablename__ = "UserGroups"
    
    GroupID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    GroupName = Column(String(100), nullable=False)
    Description = Column(Text)
    CreationDate = Column(DateTime, default=func.now())
    InviteCode = Column(String(20), unique=True, nullable=False)
    CreatedByUserID = Column(Integer, ForeignKey("Users.UserID", ondelete="CASCADE"), nullable=False)

class GroupMember(Base):
    __tablename__ = "GroupMembers"
    
    UserID = Column(Integer, ForeignKey("Users.UserID", ondelete="CASCADE"), primary_key=True)
    GroupID = Column(Integer, ForeignKey("UserGroups.GroupID", ondelete="CASCADE"), primary_key=True)
    IsAdmin = Column(Boolean, default=False, nullable=False)

class Expense(Base):
    __tablename__ = "Expenses"
    
    ExpenseID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    GroupID = Column(Integer, ForeignKey("UserGroups.GroupID", ondelete="CASCADE"), nullable=False)
    PaidByUserID = Column(Integer, ForeignKey("Users.UserID", ondelete="CASCADE"), nullable=False)
    Amount = Column(Numeric(10, 2), nullable=False)
    Description = Column(String(255), nullable=False)
    Date = Column(DateTime, default=func.now())
    IsSettled = Column(Boolean, default=False, nullable=False)

class Settlement(Base):
    __tablename__ = "Settlements"
    
    SettlementID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    GroupID = Column(Integer, ForeignKey("UserGroups.GroupID", ondelete="CASCADE"), nullable=False)
    PayerUserID = Column(Integer, ForeignKey("Users.UserID", ondelete="CASCADE"), nullable=False)
    ReceiverUserID = Column(Integer, ForeignKey("Users.UserID", ondelete="CASCADE"), nullable=False)
    Amount = Column(Numeric(10, 2), nullable=False)
    Date = Column(DateTime, default=func.now())
    Status = Column(Enum("Pending", "Confirmed", "Overdue", name="settlement_status"), default="Pending")
    PaymentMethod = Column(String(50))
    DueDate = Column(DateTime, nullable=True)

class Invitation(Base):
    __tablename__ = "Invitations"
    
    InvitationID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    GroupID = Column(Integer, ForeignKey("UserGroups.GroupID", ondelete="CASCADE"), nullable=False)
    SenderUserID = Column(Integer, ForeignKey("Users.UserID", ondelete="CASCADE"), nullable=False)
    RecipientEmail = Column(String(100), nullable=False)
    Status = Column(Enum("Pending", "Accepted", "Rejected", name="invitation_status"), default="Pending")
    InvitationDate = Column(DateTime, default=func.now())
    ExpiryDate = Column(DateTime)

class Notification(Base):
    __tablename__ = "Notifications"
    
    NotificationID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID", ondelete="CASCADE"), nullable=False)
    Message = Column(String(255), nullable=False)
    Type = Column(String(50), nullable=False)
    IsRead = Column(Boolean, default=False)
    CreatedAt = Column(DateTime, default=func.now())

class SettlementPeriod(Base):
    __tablename__ = "SettlementPeriods"
    
    GroupID = Column(Integer, ForeignKey("UserGroups.GroupID", ondelete="CASCADE"), primary_key=True)
    Period = Column(String(10), nullable=False)  # "1h", "1d", "1w", "1m"
    LastSettlement = Column(DateTime, nullable=True)
    NextSettlement = Column(DateTime, nullable=True)