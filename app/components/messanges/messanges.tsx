import styles from "./messanges.module.css";
import Search from "../search/Search";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SendIcon from "@mui/icons-material/Send";
import { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { authEmitter } from "../services/authEmitter";

interface Media {
  url: string;
  type: string;
}

interface Friend {
  id: string;
  username: string;
  friendship_id?: string;
  avatar_url?: string;
  conversation_id?: string;
  unreadCount?: number;
  lastMessageDate?: Date;
}

interface Message {
  sender_id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  media?: Media;
  sender_name: string;
  id?: string | number;
}

export function Messanges() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeConversation, setActiveConversation] = useState<Friend | null>(
    null,
  );
  const [invites, setInvites] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = authEmitter.getUser();
  const currentUserId = user ? user.id : "";

  const activeConvRef = useRef<Friend | null>(null);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    const token = authEmitter.getToken();
    const newSocket = io("http://localhost:5000", { auth: { token } });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      if (currentUserId) newSocket.emit("join_personal_room", currentUserId);
    });

    newSocket.on("receiveMessage", (message: Message) => {
      const currentConv = activeConvRef.current;

      const isCurrentChat =
        currentConv &&
        String(currentConv.conversation_id) == String(message.conversation_id);

      if (isCurrentChat) {
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              (m.id && m.id === message.id) ||
              (m.created_at === message.created_at &&
                m.content === message.content),
          );
          if (isDuplicate) return prev;
          return [...prev, message];
        });
      }

      setFriends((prev) => {
        const updated = prev.map((f) => {
          const isTargetFriend =
            String(f.conversation_id) == String(message.conversation_id) ||
            String(f.id) == String(message.sender_id);

          if (isTargetFriend) {
            return {
              ...f,
              conversation_id: String(message.conversation_id),
              unreadCount: isCurrentChat ? 0 : (f.unreadCount || 0) + 1,
              lastMessageDate: new Date(message.created_at),
            };
          }
          return f;
        });

        return [...updated].sort((a, b) => {
          const dateA = a.lastMessageDate
            ? new Date(a.lastMessageDate).getTime()
            : 0;
          const dateB = b.lastMessageDate
            ? new Date(b.lastMessageDate).getTime()
            : 0;
          return dateB - dateA;
        });
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUserId]);

  const fetchData = async () => {
    const token = authEmitter.getToken();
    if (!token) return;

    try {
      const resFriends = await fetch("http://localhost:5000/api/friends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resFriends.ok) setFriends(await resFriends.json());

      const resInvites = await fetch(
        "http://localhost:5000/api/friends/invites",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (resInvites.ok) setInvites(await resInvites.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectFriend = async (friend: Friend) => {
    const token = authEmitter.getToken();
    try {
      const res = await fetch(
        `http://localhost:5000/api/conversations/friend/${friend.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveConversation({
          ...friend,
          conversation_id: data.conversation_id,
        });

        socket?.emit("join_conversation", data.conversation_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteResponse = async (
    friendshipId: string,
    action: "accept" | "reject",
  ) => {
    const token = authEmitter.getToken();
    try {
      const res = await fetch("http://localhost:5000/api/friends/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendshipId, action }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceDownload = async (
    url: string,
    filename: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      window.open(url, "_blank");
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() && !selectedFile) return;
    if (!activeConversation || !activeConversation.conversation_id) return;

    const token = authEmitter.getToken();
    const formData = new FormData();

    formData.append("conversationId", activeConversation.conversation_id);
    formData.append("content", currentMessage);
    if (selectedFile) {
      formData.append("media", selectedFile);
    }

    setCurrentMessage("");
    setSelectedFile(null);

    try {
      const res = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        console.error("Error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.contener}>
      <div className={styles.sidebar}>
        <Search
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Wyszukaj..."
        />

        <div className={styles.invates}>
          <span>Propozycje znajomości:</span>
          <div className={styles.invateContainer}>
            {invites.map((invite) => (
              <div key={invite.friendship_id} className={styles.inviteItem}>
                <img
                  className={styles.avatar}
                  src={invite.avatar_url || "/img/pepe_placeholder.png"}
                  alt=""
                />
                <p className={styles.text}>{invite.username}</p>
                <div className={styles.inviteActions}>
                  <button
                    onClick={() =>
                      handleInviteResponse(invite.friendship_id!, "accept")
                    }
                    className={styles.accept}
                  >
                    Zaakceptuj <CheckIcon className={styles.acceptIcon} />
                  </button>
                  <CloseIcon
                    className={styles.closeIcon}
                    onClick={() =>
                      handleInviteResponse(invite.friendship_id!, "reject")
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contacts}>
          {friends
            .filter((f) =>
              f.username.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((friend) => (
              <div
                className={styles.contact}
                key={friend.id}
                onClick={() => {
                  handleSelectFriend(friend);
                  setFriends((prev) =>
                    prev.map((f) =>
                      f.id === friend.id ? { ...f, unreadCount: 0 } : f,
                    ),
                  );
                }}
              >
                <div className={styles.avatarWrapper}>
                  <img
                    className={styles.avatar}
                    src={friend.avatar_url || "/img/pepe_placeholder.png"}
                    alt=""
                  />
                  {friend.unreadCount && friend.unreadCount > 0 ? (
                    <span className={styles.unreadBadge}>
                      {friend.unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className={styles.userText}>
                  <p className={styles.text}>{friend.username}</p>
                  <p className={styles.text}>Kliknij, aby rozmawiać</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className={styles.messangeArea}>
        {activeConversation ? (
          <>
            <div className={styles.headerCommunication}>
              <img
                className={styles.avatar}
                src={
                  activeConversation.avatar_url || "/img/pepe_placeholder.png"
                }
                alt=""
              />
              <p className={styles.text}>{activeConversation.username}</p>
            </div>

            <div className={styles.messages}>
              <div className={styles.scrollArea}>
                {messages.map((msg, index) => {
                  const isMine = msg.sender_id === currentUserId;
                  const messageDate = new Date(msg.created_at).toLocaleString(
                    [],
                    {
                      dateStyle: "short",
                      timeStyle: "short",
                    },
                  );

                  return (
                    <div
                      key={index}
                      className={
                        isMine ? styles.myMessage : styles.otherMessage
                      }
                    >
                      <div
                        className={styles.messageHeader}
                        style={{
                          flexDirection: isMine ? "row-reverse" : "row",
                        }}
                      >
                        <img
                          src={
                            isMine
                              ? user?.avatar || "/img/pepe_placeholder.png"
                              : activeConversation.avatar_url ||
                                "/img/pepe_placeholder.png"
                          }
                          className={styles.messageAvatarSmall}
                          alt="avatar"
                        />
                        <span>{isMine ? "Ty" : msg.sender_name}</span>
                        <span>{messageDate}</span>
                      </div>

                      {msg.content && (
                        <p
                          className={isMine ? styles.myText : styles.otherText}
                        >
                          {msg.content}
                        </p>
                      )}

                      {msg.media &&
                        (msg.media.type.startsWith("image/") ? (
                          <img
                            src={msg.media.url}
                            alt="Przesłany plik"
                            className={styles.messageImage}
                          />
                        ) : msg.media.type.startsWith("video/") ? (
                          <video
                            src={msg.media.url}
                            controls
                            className={styles.messageImage}
                          />
                        ) : (
                          <a
                            href={msg.media.url}
                            className={styles.fileDownloadLink}
                            onClick={(e) =>
                              handleForceDownload(
                                msg.media!.url,
                                msg.media!.url.split("/").pop() || "plik",
                                e,
                              )
                            }
                          >
                            Pobierz plik: {msg.media.url.split("/").pop()}
                          </a>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.input}>
              {selectedFile && (
                <div className={styles.fileInput}>
                  <span>Wybrano plik: {selectedFile.name}</span>
                  <CloseIcon
                    className={styles.closeFileIcon}
                    onClick={() => setSelectedFile(null)}
                  />
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <button
                className={`${styles.button} ${selectedFile ? styles.fileSelected : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadFileIcon className={styles.icon} />
              </button>
              <input
                type="text"
                className={styles.textArea}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  selectedFile
                    ? `Wybrano: ${selectedFile.name}`
                    : "Napisz wiadomość..."
                }
              />
              <button className={styles.button} onClick={sendMessage}>
                <SendIcon className={styles.icon} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noActive}>
            Wybierz znajomego, aby zacząć pisać.
          </div>
        )}
      </div>
    </div>
  );
}
