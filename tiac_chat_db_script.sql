USE [TiacChat]
GO
/****** Object:  Table [dbo].[channel]    Script Date: 4/1/2024 5:30:54 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[channel](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](50) NOT NULL,
	[visibility] [int] NOT NULL,
	[createdBy] [int] NOT NULL,
 CONSTRAINT [PK_channel] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[message]    Script Date: 4/1/2024 5:30:54 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[message](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[body] [nvarchar](max) NOT NULL,
	[sentFromUser] [int] NOT NULL,
	[sentToUser] [int] NULL,
	[sentToChannel] [int] NULL,
	[time] [datetime] NOT NULL,
	[IsSeen] [bit] NOT NULL,
 CONSTRAINT [PK_messages] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user]    Script Date: 4/1/2024 5:30:54 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[firstName] [varchar](50) NOT NULL,
	[lastName] [varchar](50) NOT NULL,
	[email] [varchar](100) NOT NULL,
	[password] [varchar](100) NOT NULL,
 CONSTRAINT [PK_user] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UC_email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_channel]    Script Date: 4/1/2024 5:30:54 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_channel](
	[user_id] [int] NOT NULL,
	[channel_id] [int] NOT NULL,
	[isOwner] [bit] NULL,
	[id] [int] IDENTITY(1,1) NOT NULL,
 CONSTRAINT [PK_user_channel] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UC_user_channel_user_channel] UNIQUE NONCLUSTERED 
(
	[user_id] ASC,
	[channel_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_refresh_token]    Script Date: 4/1/2024 5:30:54 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_refresh_token](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[userId] [int] NOT NULL,
	[refreshToken] [varchar](max) NOT NULL,
	[isActive] [bit] NOT NULL,
	[expirationDate] [datetime] NOT NULL,
 CONSTRAINT [PK_userRefreshToken] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[user_channel] ADD  CONSTRAINT [DF_user_channel_isOwner]  DEFAULT ((0)) FOR [isOwner]
GO
ALTER TABLE [dbo].[channel]  WITH CHECK ADD  CONSTRAINT [FK_channel_user_createdBy] FOREIGN KEY([createdBy])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[channel] CHECK CONSTRAINT [FK_channel_user_createdBy]
GO
ALTER TABLE [dbo].[message]  WITH CHECK ADD  CONSTRAINT [FK_messages_channel_sentToChannel] FOREIGN KEY([sentToChannel])
REFERENCES [dbo].[channel] ([id])
GO
ALTER TABLE [dbo].[message] CHECK CONSTRAINT [FK_messages_channel_sentToChannel]
GO
ALTER TABLE [dbo].[message]  WITH CHECK ADD  CONSTRAINT [FK_messages_user_sentFromUser] FOREIGN KEY([sentFromUser])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[message] CHECK CONSTRAINT [FK_messages_user_sentFromUser]
GO
ALTER TABLE [dbo].[message]  WITH CHECK ADD  CONSTRAINT [FK_messages_user_sentToUser] FOREIGN KEY([sentToUser])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[message] CHECK CONSTRAINT [FK_messages_user_sentToUser]
GO
ALTER TABLE [dbo].[user_channel]  WITH CHECK ADD  CONSTRAINT [FK_user_channel_channel] FOREIGN KEY([channel_id])
REFERENCES [dbo].[channel] ([id])
GO
ALTER TABLE [dbo].[user_channel] CHECK CONSTRAINT [FK_user_channel_channel]
GO
ALTER TABLE [dbo].[user_channel]  WITH CHECK ADD  CONSTRAINT [FK_user_channel_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[user_channel] CHECK CONSTRAINT [FK_user_channel_user]
GO
ALTER TABLE [dbo].[user_refresh_token]  WITH CHECK ADD  CONSTRAINT [FK_userRefreshToken_user] FOREIGN KEY([userId])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[user_refresh_token] CHECK CONSTRAINT [FK_userRefreshToken_user]
GO
ALTER TABLE [dbo].[user_refresh_token]  WITH CHECK ADD  CONSTRAINT [FK_userRefreshToken_userRefreshToken] FOREIGN KEY([id])
REFERENCES [dbo].[user_refresh_token] ([id])
GO
ALTER TABLE [dbo].[user_refresh_token] CHECK CONSTRAINT [FK_userRefreshToken_userRefreshToken]
GO
