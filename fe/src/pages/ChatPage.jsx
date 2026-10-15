import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conversationService, getInitials } from '../services/conversation.service';
import { productService } from '../services/productService';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  ShoppingBag,
  Plus,
  Search,
  Check,
  CheckCheck,
  RefreshCw,
  Phone,
  Bookmark,
  ChevronLeft,
  X,
  Package,
  RotateCcw,
  HelpCircle,
  Lock,
  ExternalLink,
  Star,
  Feather,
  Headphones,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

const chatStyles = `
  .chat-page-root {
    background-color: #FAF8F5;
    min-height: calc(100vh - 80px);
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1C1917;
    padding-bottom: 24px;
  }

  /* Breadcrumb Bar */
  .chat-breadcrumb-bar {
    background-color: #ffffff;
    border-bottom: 1px solid #ECE7E1;
    padding: 12px 0;
    margin-bottom: 16px;
    width: 100%;
  }

  .chat-breadcrumb-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.8px;
    color: #6B7280;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .bc-link {
    color: #6B7280;
    text-decoration: none;
    transition: color 0.15s;
  }

  .bc-link:hover {
    color: #111827;
  }

  .bc-sep {
    color: #D1D5DB;
    font-size: 10px;
  }

  .bc-current {
    color: #111827;
    font-weight: 700;
  }

  .chat-page-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }

  /* Page Header Title & Subtitle */
  .chat-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 16px;
  }

  .chat-header-heading {
    font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    color: #111827;
    margin: 0;
  }

  .chat-header-desc {
    font-size: 13px;
    color: #6B7280;
    margin-top: 4px;
  }

  /* Unified Chat Frame - Chiều cao co giãn thông minh vừa vặn màn hình */
  .chat-unified-frame {
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
    display: grid;
    grid-template-columns: 360px 1fr;
    height: calc(100vh - 210px);
    min-height: 520px;
    max-height: 750px;
    overflow: hidden;
  }

  /* Left Column: Conversation Sidebar */
  .chat-sidebar-col {
    border-right: 1px solid #ECE7E1;
    display: flex;
    flex-direction: column;
    background: #FFFFFF;
    height: 100%;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 18px 20px 14px 20px;
    border-bottom: 1px solid #F2EFEB;
  }

  .sidebar-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .sidebar-title {
    font-size: 18px;
    font-weight: 700;
    font-family: 'Playfair Display', Georgia, serif;
    color: #111827;
    letter-spacing: -0.2px;
  }

  .btn-new-conv {
    background: #111827;
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.6px;
    padding: 7px 14px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-new-conv:hover {
    background: #27272A;
    transform: translateY(-1px);
  }

  /* Search Input */
  .sidebar-search-box {
    position: relative;
    margin-bottom: 10px;
  }

  .search-input-field {
    width: 100%;
    background: #F7F6F2;
    border: 1px solid #EBE8E1;
    border-radius: 8px;
    padding: 8px 12px 8px 34px;
    font-size: 12.5px;
    color: #111827;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input-field:focus {
    border-color: #111827;
    background: #FFFFFF;
  }

  .search-icon-inside {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #9CA3AF;
    pointer-events: none;
  }

  /* Filter Pills */
  .conv-filter-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .filter-pill-btn {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    color: #6B7280;
    background: #F2EFEB;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filter-pill-btn:hover {
    color: #111827;
  }

  .filter-pill-btn.active {
    background: #111827;
    color: #FFFFFF;
  }

  /* Conversations List View */
  .conv-list-stream {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .conv-item {
    display: flex;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.18s ease;
    border: 1px solid transparent;
    margin-bottom: 4px;
    position: relative;
  }

  .conv-item:hover {
    background-color: #F8F7F4;
  }

  .conv-item.active {
    background-color: #F4F1EB;
    border-color: #E2DDD5;
  }

  .conv-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 3.5px;
    background-color: #111827;
    border-radius: 0 4px 4px 0;
  }

  .conv-avatar-box {
    position: relative;
    flex-shrink: 0;
  }

  .conv-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #ECE7E1;
  }

  .conv-online-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #16A34A;
    border: 2px solid #FFFFFF;
  }

  .conv-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .conv-top-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .conv-title {
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .conv-time {
    font-size: 10.5px;
    color: #9CA3AF;
    flex-shrink: 0;
  }

  .conv-meta-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 1px 0;
  }

  .conv-type-tag {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    padding: 1.5px 6px;
    border-radius: 4px;
    background: #EBE8E1;
    color: #4B5563;
  }

  .status-tag {
    font-size: 9.5px;
    font-weight: 600;
    padding: 1.5px 6px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .status-tag.open {
    background: #ECFDF5;
    color: #065F46;
    border: 1px solid #A7F3D0;
  }

  .status-tag.processing {
    background: #EFF6FF;
    color: #1E40AF;
    border: 1px solid #BFDBFE;
  }

  .status-tag.closed {
    background: #F3F4F6;
    color: #4B5563;
    border: 1px solid #E5E7EB;
  }

  .conv-bottom-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .conv-preview-text {
    font-size: 12px;
    color: #6B7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .unread-count-pill {
    background: #111827;
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 700;
    min-width: 17px;
    height: 17px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    flex-shrink: 0;
  }

  /* Empty Sidebar State */
  .conv-sidebar-empty {
    padding: 40px 20px;
    text-align: center;
    color: #9CA3AF;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  /* Right Column: Chat Main Area */
  .chat-detail-col {
    display: flex;
    flex-direction: column;
    background: #FAFAF9;
    height: 100%;
    overflow: hidden;
  }

  /* Chat Top Header */
  .chat-header-bar {
    background: #FFFFFF;
    border-bottom: 1px solid #ECE7E1;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
  }

  .header-left-info {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .mobile-back-btn {
    display: none;
    background: none;
    border: none;
    color: #111827;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
  }

  .active-conv-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #E5E7EB;
    flex-shrink: 0;
  }

  .conv-avatar-initials {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #111111;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    border: 1px solid #E5E7EB;
  }

  .active-conv-avatar-initials {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #111111;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    border: 1.5px solid #E5E7EB;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .active-conv-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .active-conv-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .active-conv-manager-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .cskh-role-badge {
    background: #111827;
    color: #FFFFFF;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .active-conv-topic {
    font-size: 12.5px;
    color: #6B7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-right-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .header-tool-btn {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    color: #4B5563;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .header-tool-btn:hover {
    background: #F7F6F2;
    color: #111827;
    border-color: #D1D5DB;
  }

  /* Context Bar (Product or Order card) */
  .chat-context-bar {
    background: #FFFFFF;
    border-bottom: 1px solid #ECE7E1;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }

  .context-card-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .context-img {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid #ECE7E1;
  }

  .context-title-box {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .context-tag-label {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #B45309;
  }

  .context-item-title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  .context-item-price {
    font-size: 12px;
    color: #6B7280;
  }

  .context-view-btn {
    font-size: 11.5px;
    font-weight: 600;
    color: #111827;
    text-decoration: underline;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  /* Message Stream Area */
  .chat-messages-scroll {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    scroll-behavior: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .date-separator-pill {
    align-self: center;
    background: #ECE7E1;
    color: #57534E;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 9999px;
  }

  /* Message Rows */
  .chat-msg-row {
    display: flex;
    flex-direction: column;
    max-width: 78%;
    animation: fadeIn 0.2s ease-out;
  }

  /* Người gửi là chính người dùng đang xem màn hình (isMe) -> Luôn hiển thị BÊN PHẢI */
  .chat-msg-row.me {
    align-self: flex-end;
    align-items: flex-end;
  }

  /* Người gửi là phía đối diện (!isMe) -> Luôn hiển thị BÊN TRÁI */
  .chat-msg-row.them {
    align-self: flex-start;
    align-items: flex-start;
  }

  /* Tương thích ngược */
  .chat-msg-row.customer {
    align-self: flex-end;
    align-items: flex-end;
  }

  .chat-msg-row.employee {
    align-self: flex-start;
    align-items: flex-start;
  }

  .msg-meta-line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 11px;
    color: #9CA3AF;
  }

  .msg-bubble {
    padding: 14px 18px;
    border-radius: 16px;
    font-size: 13.5px;
    line-height: 1.6;
    word-break: break-word;
    position: relative;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  }

  /* BONG BÓNG TIN NHẮN CỦA CHÍNH MÌNH (isMe): MÀU ĐEN (#111827), CHỮ TRẮNG (#FFFFFF) */
  .chat-msg-row.me .msg-bubble,
  .chat-msg-row.customer .msg-bubble {
    background: #111827;
    color: #FFFFFF;
    border: none;
    border-top-right-radius: 4px;
  }

  /* BONG BÓNG TIN NHẮN CỦA ĐỐI PHƯƠNG (!isMe): MÀU TRẮNG (#FFFFFF), CHỮ ĐEN (#1C1917), VIỀN XÁM */
  .chat-msg-row.them .msg-bubble,
  .chat-msg-row.employee .msg-bubble {
    background: #FFFFFF;
    color: #1C1917;
    border: 1px solid #ECE7E1;
    border-top-left-radius: 4px;
  }

  /* Product Attachment Card inside Bubble */
  .bubble-product-card {
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 10px;
    color: #111827;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
    max-width: 440px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    text-align: left;
  }

  .bubble-product-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .bubble-product-thumb {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid #E5E7EB;
    flex-shrink: 0;
  }

  .bubble-product-desc {
    font-size: 11.5px;
    color: #4B5563;
    margin-top: 4px;
    line-height: 1.4;
    white-space: normal;
  }

  /* Attached Image */
  .msg-attachment-img {
    max-width: 240px;
    max-height: 180px;
    border-radius: 8px;
    margin-top: 8px;
    cursor: pointer;
    border: 1px solid #ECE7E1;
  }

  /* Typing Indicator */
  .typing-indicator-row {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #FFFFFF;
    border: 1px solid #ECE7E1;
    border-radius: 14px;
    padding: 8px 14px;
    font-size: 12px;
    color: #6B7280;
  }

  .typing-dots {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .typing-dot {
    width: 5px;
    height: 5px;
    background: #9CA3AF;
    border-radius: 50%;
    animation: typingPulse 1.4s infinite ease-in-out both;
  }

  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes typingPulse {
    0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* Empty Chat Stream */
  .chat-empty-stream {
    margin: auto;
    text-align: center;
    padding: 40px 20px;
    max-width: 400px;
  }

  .chat-empty-icon-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #F4F1EB;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px auto;
    color: #111827;
  }

  /* Bottom Chat Input Bar */
  .chat-bottom-input-bar {
    background: #FFFFFF;
    border-top: 1px solid #ECE7E1;
    padding: 16px 24px;
    flex-shrink: 0;
  }

  .input-container-shell {
    background: #FAF9F6;
    border: 1px solid #EBE8E1;
    border-radius: 12px;
    padding: 8px 12px 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .input-container-shell:focus-within {
    border-color: #111827;
    background: #FFFFFF;
  }

  .chat-textarea-field {
    flex: 1;
    background: transparent;
    border: none;
    font-size: 13.5px;
    color: #111827;
    outline: none;
    resize: none;
    font-family: inherit;
    line-height: 1.4;
    max-height: 100px;
  }

  .input-actions-cluster {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .input-tool-icon-btn {
    background: none;
    border: none;
    color: #6B7280;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: color 0.15s, background-color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-tool-icon-btn:hover {
    color: #111827;
    background: #F2EFEB;
  }

  .send-msg-btn {
    background: #111827;
    color: #FFFFFF;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: 4px;
  }

  .send-msg-btn:hover:not(:disabled) {
    background: #27272A;
    transform: scale(1.04);
  }

  .send-msg-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .input-helper-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    font-size: 11px;
    color: #9CA3AF;
  }

  /* Modals */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
  }

  .modal-card {
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    animation: fadeIn 0.25s ease-out;
  }

  .modal-header {
    padding: 18px 24px;
    border-bottom: 1px solid #F0EEE9;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 19px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: #9CA3AF;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
  }

  .modal-close-btn:hover {
    color: #111827;
  }

  .modal-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #4B5563;
  }

  .form-input {
    background: #FAF9F6;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13.5px;
    color: #111827;
    outline: none;
    font-family: inherit;
  }

  .form-input:focus {
    border-color: #111827;
    background: #FFFFFF;
  }

  .type-selection-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .type-option-card {
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.15s;
    background: #FAF9F6;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .type-option-card:hover {
    border-color: #111827;
  }

  .type-option-card.selected {
    background: #111827;
    border-color: #111827;
    color: #FFFFFF;
  }

  .type-card-title {
    font-size: 13px;
    font-weight: 700;
  }

  .type-card-desc {
    font-size: 11px;
    color: #6B7280;
  }

  .type-option-card.selected .type-card-desc {
    color: #D1D5DB;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #F0EEE9;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* Not Logged In View */
  .guest-overlay-box {
    margin: auto;
    text-align: center;
    padding: 60px 24px;
    max-width: 460px;
  }

  .guest-icon-badge {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: #F4F1EB;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px auto;
    color: #111827;
  }

  .guest-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .guest-desc {
    font-size: 13.5px;
    color: #6B7280;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  /* Responsive Queries */
  @media (max-width: 960px) {
    .chat-unified-frame {
      grid-template-columns: 280px 1fr;
      height: 660px;
    }
  }

  @media (max-width: 720px) {
    .chat-unified-frame {
      grid-template-columns: 1fr;
      height: calc(100vh - 180px);
    }

    .chat-sidebar-col.mobile-hidden {
      display: none !important;
    }

    .chat-detail-col.mobile-hidden {
      display: none !important;
    }

    .mobile-back-btn {
      display: inline-flex;
    }

    .type-selection-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileDetailView, setMobileDetailView] = useState(false);

  // Modals
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newConvType, setNewConvType] = useState('PRODUCT_INQUIRY');
  const [newConvTitle, setNewConvTitle] = useState('');
  const [newConvInitialMsg, setNewConvInitialMsg] = useState('');
  const [newConvProduct, setNewConvProduct] = useState(null);
  const [newConvOrderNumber, setNewConvOrderNumber] = useState('');

  // Product Picker Modal
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [storeProducts, setStoreProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Lightbox Modal
  const [lightboxImg, setLightboxImg] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesScrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Giữ màn hình và khung chat cố định, không tự ý trượt xuống dưới
  const scrollToBottom = () => {};

  // Load store products for attachment
  const fetchStoreProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await productService.getProducts({ limit: 20 });
      const items = res.data?.products || res.products || [];
      setStoreProducts(items);
    } catch (err) {
      console.warn('Lỗi khi tải danh sách sản phẩm cửa hàng:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 1. Initial Load of Conversations
  useEffect(() => {
    // Luôn giữ đỉnh trang, tránh bị trượt khi load
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await conversationService.getConversations(user);
        const convList = res.data || [];
        setConversations(convList);

        // Check if navigated from Product Detail with initial product
        if (location.state?.initialProduct) {
          const prod = location.state.initialProduct;
          let targetConv = convList.find(
            (c) => c.attached_product && (String(c.attached_product.id) === String(prod.id) || c.attached_product.name === prod.name)
          );

          if (!targetConv && convList.length > 0) {
            targetConv = convList[0];
          }

          if (targetConv) {
            setActiveConversationId(targetConv.conversation_id);
            setMobileDetailView(true);
            await loadMessages(targetConv.conversation_id);
            await conversationService.sendMessage(
              targetConv.conversation_id,
              {
                content: `Chào shop, mình quan tâm đến sản phẩm "${prod.name}". Shop tư vấn giúp mình nhé!`,
                product_card: prod,
              },
              user
            );
            await loadMessages(targetConv.conversation_id);
            if (messagesScrollContainerRef.current) {
              messagesScrollContainerRef.current.scrollTop = 0;
            }
          } else {
            // Pre-fill and open New Conversation Modal for this product
            setNewConvType('PRODUCT_INQUIRY');
            setNewConvProduct(prod);
            setNewConvTitle(`Tư vấn ${prod.name}`);
            setNewConvInitialMsg(`Chào shop, mình quan tâm đến sản phẩm "${prod.name}". Shop tư vấn giúp mình nhé!`);
            setShowNewConvModal(true);
          }
        } else if (convList.length > 0) {
          const first = convList[0];
          setActiveConversationId(first.conversation_id);
          await loadMessages(first.conversation_id);
          if (messagesScrollContainerRef.current) {
            messagesScrollContainerRef.current.scrollTop = 0;
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    fetchStoreProducts();
  }, [user, location.state]);

  // Load messages for a specific conversation
  const loadMessages = async (convId) => {
    try {
      const res = await conversationService.getMessages(convId, user);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // Lắng nghe tin nhắn phản hồi Realtime từ cả Khách hàng & Quản lý qua SSE
  useEffect(() => {
    const isManagerViewer =
      user?.user_type === 'EMPLOYEE' ||
      user?.role === 'MANAGER' ||
      user?.role === 'ADMIN' ||
      user?.employee_role === 'ADMIN' ||
      user?.employee_role === 'MANAGER';

    const unsubscribe = conversationService.subscribeToChatStream(
      (newMsg) => {
        setActiveConversationId((currId) => {
          if (String(currId) === String(newMsg.conversation_id)) {
            setMessages((prev) => {
              if (prev.some((m) => String(m.id) === String(newMsg.message_id))) return prev;
              const isMe = isManagerViewer
                ? newMsg.sender_type === 'EMPLOYEE'
                : newMsg.sender_type === 'CUSTOMER';

              return [
                ...prev,
                {
                  id: String(newMsg.message_id),
                  sender: newMsg.sender_type,
                  authorName: isMe
                    ? (isManagerViewer ? 'Bạn (Quản lý)' : 'Bạn')
                    : (newMsg.sender_name || (isManagerViewer ? 'Khách Hàng' : 'Quản Lý Youth Fashion')),
                  text: newMsg.content || '',
                  attachment_url: newMsg.attachment_url || null,
                  product_card: newMsg.product_card || null,
                  time: new Date(newMsg.created_at || Date.now()).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  created_at: newMsg.created_at || new Date().toISOString(),
                },
              ];
            });
          }
          return currId;
        });

        // Cập nhật trạng thái và tin nhắn cuối trong danh sách hội thoại
        setConversations((prev) =>
          prev.map((c) =>
            String(c.conversation_id) === String(newMsg.conversation_id)
              ? { ...c, last_message: newMsg.content, last_message_at: new Date().toISOString() }
              : c
          )
        );
      },
      (statusData) => {
        setConversations((prev) =>
          prev.map((c) =>
            String(c.conversation_id) === String(statusData.conversation_id)
              ? { ...c, status: statusData.status }
              : c
          )
        );
      }
    );

    // Polling dự phòng mỗi 3 giây để đảm bảo 100% dữ liệu đồng bộ
    const interval = setInterval(async () => {
      if (!activeConversationId) return;
      try {
        const res = await conversationService.getMessages(activeConversationId, user);
        if (res.data && res.data.length > 0) {
          setMessages((prev) => {
            if (prev.length !== res.data.length) {
              return res.data;
            }
            return prev;
          });
        }
      } catch (e) {
        // quiet polling failure
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [activeConversationId, user]);

  // Handle select conversation
  const handleSelectConversation = async (convId) => {
    setActiveConversationId(convId);
    setMobileDetailView(true);
    await loadMessages(convId);
    // Khi mở đoạn chat khác, giữ ở đầu trang tin nhắn để đọc từ đầu, KHÔNG tự động trượt xuống
    if (messagesScrollContainerRef.current) {
      messagesScrollContainerRef.current.scrollTop = 0;
    }
  };

  // Send Message
  const handleSendMessage = async (e, customPayload = null) => {
    e?.preventDefault();
    const content = customPayload?.content !== undefined ? customPayload.content : inputText.trim();
    const attachmentUrl = customPayload?.attachment_url || null;
    const productCard = customPayload?.product_card || null;

    if (!content && !attachmentUrl && !productCard) return;
    if (!activeConversationId) return;

    setInputText('');
    setSending(true);

    try {
      const res = await conversationService.sendMessage(
        activeConversationId,
        {
          content,
          attachment_url: attachmentUrl,
          message_type: attachmentUrl ? 'IMAGE' : (productCard ? 'PRODUCT' : 'TEXT'),
          product_card: productCard,
        },
        user
      );

      const savedMsg = res.data;
      // Cập nhật tin nhắn vào danh sách, TUYỆT ĐỐI KHÔNG tự động trượt màn hình xuống dưới
      setMessages((prev) => [...prev, savedMsg]);

      // Update last message in list
      setConversations((prev) =>
        prev.map((c) =>
          String(c.conversation_id) === String(activeConversationId)
            ? { ...c, last_message: content || '[Tập tin đính kèm]', last_message_at: new Date().toISOString() }
            : c
        )
      );

    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create New Conversation
  const handleCreateNewConversation = async (e) => {
    e.preventDefault();
    if (!newConvTitle.trim()) return;

    try {
      setSending(true);
      const res = await conversationService.createConversation(
        {
          title: newConvTitle.trim(),
          initial_message: newConvInitialMsg.trim(),
          attached_product: newConvProduct,
        },
        user
      );

      const created = res.data;
      if (created) {
        setConversations((prev) => [created, ...prev]);
        setActiveConversationId(created.conversation_id);
        setMessages(created.messages || []);
      }
      setShowNewConvModal(false);
      setMobileDetailView(true);

      // Reset modal fields
      setNewConvTitle('');
      setNewConvInitialMsg('');
      setNewConvProduct(null);
      setNewConvOrderNumber('');
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle Image Upload selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      handleSendMessage(null, {
        content: 'Đã gửi một hình ảnh đính kèm',
        attachment_url: base64Url,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Attach selected product into chat message
  const handleSelectProductToAttach = (prod) => {
    const pCard = {
      id: prod.product_id || prod.id,
      name: prod.product_name || prod.name,
      price: prod.price || (prod.variants?.[0]?.price ? Number(prod.variants[0].price) : 550000),
      image: prod.images?.[0]?.image_url || prod.image || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      sku: prod.sku || prod.variants?.[0]?.sku || `YF-${prod.product_id || prod.id}`,
      description: prod.description || prod.short_description || 'Thiết kế thời trang cao cấp YOUTH FASHION.',
    };

    handleSendMessage(null, {
      content: `Mình muốn hỏi về sản phẩm: ${pCard.name}`,
      product_card: pCard,
    });
    setShowProductPicker(false);
  };

  // Active Conversation Object
  const activeConversation = conversations.find(
    (c) => String(c.conversation_id) === String(activeConversationId)
  );

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    return (
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.manager_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="chat-page-root">
      <style>{chatStyles}</style>

      {/* 1. Breadcrumbs Bar */}
      <div className="chat-breadcrumb-bar">
        <div className="chat-breadcrumb-content">
          <Link to="/" className="bc-link">TRANG CHỦ</Link>
          <span className="bc-sep">&gt;</span>
          <span className="bc-current">TƯ VẤN &amp; HỘI THOẠI</span>
        </div>
      </div>

      <div className="chat-page-container">
        {/* Title Header */}
        <div className="chat-title-row">
          <div>
            <h1 className="chat-header-heading">Hộp Thư Tư Vấn Trực Tuyến</h1>
            <p className="chat-header-desc">
              Kết nối trực tiếp cùng chuyên viên phong cách &amp; đội ngũ quản lý YOUTH FASHION
            </p>
          </div>
        </div>

        {/* Unified Chat Frame */}
        <div className="chat-unified-frame">
          {/* CỘT BÊN TRÁI: DANH SÁCH HỘI THOẠI */}
          <aside className={`chat-sidebar-col ${mobileDetailView ? 'mobile-hidden' : ''}`}>
            <div className="sidebar-header">
              <div className="sidebar-top-bar">
                <span className="sidebar-title">Tin nhắn</span>
                <button
                  type="button"
                  className="btn-new-conv"
                  onClick={() => setShowNewConvModal(true)}
                  title="Tạo cuộc hội thoại mới"
                >
                  <Plus size={14} />
                  <span>Hội thoại mới</span>
                </button>
              </div>

              {/* Ô tìm kiếm hội thoại */}
              <div className="sidebar-search-box">
                <Search size={14} className="search-icon-inside" />
                <input
                  type="text"
                  placeholder="Tìm kiếm hội thoại, nội dung..."
                  className="search-input-field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Danh sách các cuộc trò chuyện */}
            <div className="conv-list-stream">
              {loading ? (
                <div className="conv-sidebar-empty">
                  <RefreshCw size={24} className="animate-spin" />
                  <span>Đang tải danh sách hội thoại...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="conv-sidebar-empty">
                  <MessageSquare size={32} />
                  <span>Chưa có cuộc trò chuyện nào</span>
                  <button
                    type="button"
                    className="btn-new-conv"
                    style={{ marginTop: 8 }}
                    onClick={() => setShowNewConvModal(true)}
                  >
                    Bắt đầu hội thoại mới
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = String(conv.conversation_id) === String(activeConversationId);
                  return (
                    <div
                      key={conv.conversation_id}
                      className={`conv-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(conv.conversation_id)}
                    >
                      <div className="conv-avatar-box">
                        <div className="conv-avatar-initials">
                          {getInitials(conv.manager_name || 'Quản Lý')}
                        </div>
                        <span className="conv-online-dot" />
                      </div>

                      <div className="conv-body">
                        <div className="conv-top-line">
                          <span className="conv-title">{conv.title}</span>
                          <span className="conv-time">
                            {conv.last_message_at
                              ? new Date(conv.last_message_at).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Vừa xong'}
                          </span>
                        </div>

                        <div className="conv-bottom-line" style={{ marginTop: 4 }}>
                          <span className="conv-preview-text">
                            {conv.last_message || 'Bắt đầu cuộc trò chuyện...'}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="unread-count-pill">{conv.unread_count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* CỘT BÊN PHẢI: CHI TIẾT CUỘC HỘI THOẠI */}
          <main className={`chat-detail-col ${!mobileDetailView ? 'mobile-hidden' : ''}`}>
            {activeConversation ? (
              <>
                {/* 5.1 Header hội thoại */}
                <div className="chat-header-bar">
                  <div className="header-left-info">
                    <button
                      type="button"
                      className="mobile-back-btn"
                      onClick={() => setMobileDetailView(false)}
                      title="Quay lại danh sách"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="active-conv-avatar-initials">
                      {getInitials(activeConversation.manager_name || 'Quản Lý Youth Fashion')}
                    </div>

                    <div className="active-conv-meta">
                      <div className="active-conv-name-row">
                        <span className="active-conv-manager-name">
                          {activeConversation.manager_name || 'Quản Lý Youth Fashion'}
                        </span>
                        <span className="cskh-role-badge">
                          {activeConversation.manager_role || 'QUẢN LÝ CỬA HÀNG'}
                        </span>
                      </div>
                      <span className="active-conv-topic">
                        Chủ đề: <strong>{activeConversation.title}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5.2 Thẻ ngữ cảnh: Thông tin sản phẩm hoặc đơn hàng */}
                {activeConversation.attached_product && (
                  <div className="chat-context-bar">
                    <div className="context-card-content">
                      <img
                        src={activeConversation.attached_product.image}
                        alt={activeConversation.attached_product.name}
                        className="context-img"
                      />
                      <div className="context-title-box">
                        <span className="context-tag-label">SẢN PHẨM ĐANG TƯ VẤN</span>
                        <span className="context-item-title">
                          {activeConversation.attached_product.name}
                        </span>
                        <span className="context-item-price">
                          Mã hàng: <strong>{activeConversation.attached_product.sku || `YF-${activeConversation.attached_product.id}`}</strong> &bull; Giá:{' '}
                          <strong style={{ color: '#16A34A' }}>
                            {Number(activeConversation.attached_product.price).toLocaleString('vi-VN')}₫
                          </strong>
                        </span>
                        {activeConversation.attached_product.description && (
                          <div style={{ fontSize: 11.5, color: '#4B5563', marginTop: 3, lineHeight: 1.4, maxWidth: 580 }}>
                            {activeConversation.attached_product.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/products/${activeConversation.attached_product.id}`}
                      className="context-view-btn"
                      target="_blank"
                    >
                      <span>Xem sản phẩm</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                )}

                {activeConversation.attached_order && (
                  <div className="chat-context-bar">
                    <div className="context-card-content">
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1E40AF',
                        }}
                      >
                        <Package size={20} />
                      </div>
                      <div className="context-title-box">
                        <span className="context-tag-label">ĐƠN HÀNG CẦN HỖ TRỢ</span>
                        <span className="context-item-title">
                          Đơn hàng: {activeConversation.attached_order.order_number}
                        </span>
                        <span className="context-item-price">
                          Trạng thái: <strong>{activeConversation.attached_order.status}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5.3 Khu vực tin nhắn (Messages body) */}
                <div className="chat-messages-scroll" ref={messagesScrollContainerRef}>
                  <div className="date-separator-pill">HÔM NAY</div>

                  {messages.length === 0 ? (
                    <div className="chat-empty-stream">
                      <div className="chat-empty-icon-circle">
                        <MessageSquare size={26} />
                      </div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0' }}>
                        Bắt đầu cuộc trò chuyện
                      </h4>
                      <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                        Gửi câu hỏi hoặc yêu cầu tư vấn bên dưới, đội ngũ phong cách YOUTH FASHION sẽ phản hồi ngay!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isManagerViewer =
                        user?.user_type === 'EMPLOYEE' ||
                        user?.role === 'MANAGER' ||
                        user?.role === 'ADMIN' ||
                        user?.employee_role === 'ADMIN' ||
                        user?.employee_role === 'MANAGER';

                      // Người đang ngồi xem màn hình là người gửi tin nhắn này -> isMe = true
                      const isMe = isManagerViewer
                        ? msg.sender === 'EMPLOYEE'
                        : msg.sender === 'CUSTOMER';

                      // Tên hiển thị người gửi:
                      // - Phía người đang ngồi nhắn (isMe) -> Luôn là "Bạn" hoặc "Bạn (Quản lý)"
                      // - Phía đối phương (!isMe) -> Quản lý nhìn thấy tên Khách Hàng; Khách hàng nhìn thấy Quản Lý Youth Fashion
                      let authorLabel = 'Bạn';
                      if (isMe) {
                        authorLabel = isManagerViewer ? 'Bạn (Quản lý)' : 'Bạn';
                      } else {
                        authorLabel = isManagerViewer
                          ? (activeConversation?.customer_name || 'Khách Hàng')
                          : (activeConversation?.manager_name || 'Quản Lý Youth Fashion');
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`chat-msg-row ${isMe ? 'me' : 'them'}`}
                        >
                          <div className="msg-meta-line">
                            <span>{authorLabel}</span>
                            <span>&bull;</span>
                            <span>{msg.time || 'Vừa xong'}</span>
                          </div>

                          <div className="msg-bubble">
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                            {/* Ảnh đính kèm */}
                            {msg.attachment_url && (
                              <img
                                src={msg.attachment_url}
                                alt="Ảnh đính kèm"
                                className="msg-attachment-img"
                                onClick={() => setLightboxImg(msg.attachment_url)}
                              />
                            )}

                            {/* Thẻ sản phẩm đính kèm */}
                            {msg.product_card && (
                              <Link
                                to={`/products/${msg.product_card.id}`}
                                className="bubble-product-card"
                                target="_blank"
                              >
                                <img
                                  src={msg.product_card.image}
                                  alt={msg.product_card.name}
                                  className="bubble-product-thumb"
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#B45309', letterSpacing: 0.5 }}>
                                    MÃ HÀNG: {msg.product_card.sku || `YF-${msg.product_card.id}`}
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 1 }}>
                                    {msg.product_card.name}
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', marginTop: 2 }}>
                                    {Number(msg.product_card.price).toLocaleString('vi-VN')}₫
                                  </div>
                                  {msg.product_card.description && (
                                    <div className="bubble-product-desc">
                                      {msg.product_card.description}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 600, marginTop: 5, textDecoration: 'underline' }}>
                                    Xem chi tiết sản phẩm ↗
                                  </div>
                                </div>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Hiệu ứng đang soạn tin nhắn */}
                  {isTyping && (
                    <div className="typing-indicator-row">
                      <div className="typing-dots">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                      <span>{activeConversation.manager_name} đang soạn câu trả lời...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* 5.4 Khu vực nhập tin nhắn */}
                <div className="chat-bottom-input-bar">
                  <form onSubmit={handleSendMessage} className="input-container-shell">
                    <textarea
                      rows={1}
                      placeholder="Nhập câu hỏi hoặc yêu cầu tư vấn..."
                      className="chat-textarea-field"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                    />

                    <div className="input-actions-cluster">
                      {/* Nút đính kèm ảnh */}
                      <button
                        type="button"
                        className="input-tool-icon-btn"
                        title="Đính kèm hình ảnh"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon size={18} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageFileChange}
                      />

                      {/* Nút đính kèm sản phẩm */}
                      <button
                        type="button"
                        className="input-tool-icon-btn"
                        title="Đính kèm sản phẩm từ cửa hàng"
                        onClick={() => setShowProductPicker(true)}
                      >
                        <ShoppingBag size={18} />
                      </button>

                      {/* Nút gửi */}
                      <button
                        type="submit"
                        className="send-msg-btn"
                        disabled={!inputText.trim() || sending}
                        title="Gửi tin nhắn (Enter)"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </form>

                  <div className="input-helper-footer">
                    <span>Nhấn Enter để gửi &bull; Shift + Enter để xuống dòng</span>
                    <span>🔒 Bảo mật thông tin riêng tư khách hàng</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="guest-overlay-box">
                <div className="guest-icon-badge">
                  <MessageSquare size={30} />
                </div>
                <h3 className="guest-title">Chào Mừng Đến Với Hộp Thư Tư Vấn</h3>
                <p className="guest-desc">
                  Chọn một cuộc trò chuyện từ danh sách bên trái hoặc nhấn nút "Hội thoại mới" để bắt đầu được chuyên viên hỗ trợ.
                </p>
                <button
                  type="button"
                  className="btn-new-conv"
                  style={{ padding: '12px 24px', fontSize: 13 }}
                  onClick={() => setShowNewConvModal(true)}
                >
                  <Plus size={16} />
                  <span>Bắt đầu cuộc trò chuyện mới</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL 1: BẮT ĐẦU CUỘC TRÒ CHUYỆN MỚI */}
      {showNewConvModal && (
        <div className="modal-overlay" onClick={() => setShowNewConvModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Bắt Đầu Cuộc Trò Chuyện Mới</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNewConvModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewConversation}>
              <div className="modal-body">
                {/* Chọn loại yêu cầu */}
                <div className="form-group">
                  <label className="form-label">Chọn Loại Yêu Cầu Hỗ Trợ</label>
                  <div className="type-selection-grid">
                    <div
                      className={`type-option-card ${newConvType === 'PRODUCT_INQUIRY' ? 'selected' : ''}`}
                      onClick={() => {
                        setNewConvType('PRODUCT_INQUIRY');
                        if (!newConvTitle) setNewConvTitle('Tư vấn sản phẩm');
                      }}
                    >
                      <ShoppingBag size={18} />
                      <span className="type-card-title">Tư vấn sản phẩm</span>
                      <span className="type-card-desc">Hỏi size, chất liệu, phối đồ</span>
                    </div>

                    <div
                      className={`type-option-card ${newConvType === 'ORDER_SUPPORT' ? 'selected' : ''}`}
                      onClick={() => {
                        setNewConvType('ORDER_SUPPORT');
                        if (!newConvTitle) setNewConvTitle('Hỗ trợ đơn hàng');
                      }}
                    >
                      <Package size={18} />
                      <span className="type-card-title">Hỗ trợ đơn hàng</span>
                      <span className="type-card-desc">Kiểm tra tiến độ giao hàng</span>
                    </div>

                    <div
                      className={`type-option-card ${newConvType === 'RETURN_REFUND' ? 'selected' : ''}`}
                      onClick={() => {
                        setNewConvType('RETURN_REFUND');
                        if (!newConvTitle) setNewConvTitle('Yêu cầu đổi trả');
                      }}
                    >
                      <RotateCcw size={18} />
                      <span className="type-card-title">Yêu cầu đổi trả</span>
                      <span className="type-card-desc">Đổi size, mẫu mã tận nhà</span>
                    </div>

                    <div
                      className={`type-option-card ${newConvType === 'GENERAL' ? 'selected' : ''}`}
                      onClick={() => {
                        setNewConvType('GENERAL');
                        if (!newConvTitle) setNewConvTitle('Hỗ trợ chung');
                      }}
                    >
                      <HelpCircle size={18} />
                      <span className="type-card-title">Yêu cầu khác</span>
                      <span className="type-card-desc">Góp ý hoặc thắc mắc chung</span>
                    </div>
                  </div>
                </div>

                {/* Chọn sản phẩm nếu là Tư vấn sản phẩm */}
                {newConvType === 'PRODUCT_INQUIRY' && (
                  <div className="form-group">
                    <label className="form-label">Sản phẩm cần tư vấn</label>
                    {newConvProduct ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FAF9F6',
                          border: '1px solid #E5E7EB',
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={newConvProduct.image}
                            alt=""
                            style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{newConvProduct.name}</div>
                            <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                              {Number(newConvProduct.price).toLocaleString('vi-VN')}₫
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => setNewConvProduct(null)}
                        >
                          Gỡ bỏ
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        style={{
                          background: '#FFFFFF',
                          border: '1px dashed #D1D5DB',
                          borderRadius: 8,
                          padding: '10px 14px',
                          color: '#4B5563',
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                        onClick={() => setShowProductPicker(true)}
                      >
                        <ShoppingBag size={15} />
                        <span>Chọn sản phẩm từ danh mục cửa hàng (Tùy chọn)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Nhập mã đơn hàng nếu là Hỗ trợ đơn hàng */}
                {newConvType === 'ORDER_SUPPORT' && (
                  <div className="form-group">
                    <label className="form-label">Mã đơn hàng</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: #YF-10025"
                      className="form-input"
                      value={newConvOrderNumber}
                      onChange={(e) => setNewConvOrderNumber(e.target.value)}
                    />
                  </div>
                )}

                {/* Tiêu đề cuộc trò chuyện */}
                <div className="form-group">
                  <label className="form-label">Tiêu đề cuộc trò chuyện *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tư vấn áo Polo Silk Cotton"
                    className="form-input"
                    value={newConvTitle}
                    onChange={(e) => setNewConvTitle(e.target.value)}
                  />
                </div>

                {/* Tin nhắn mở đầu */}
                <div className="form-group">
                  <label className="form-label">Nội dung tin nhắn ban đầu</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập nội dung bạn muốn hỏi hoặc cần hỗ trợ..."
                    className="form-input"
                    value={newConvInitialMsg}
                    onChange={(e) => setNewConvInitialMsg(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="header-tool-btn"
                  onClick={() => setShowNewConvModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-new-conv"
                  style={{ padding: '9px 20px', fontSize: 12 }}
                  disabled={!newConvTitle.trim() || sending}
                >
                  Bắt đầu hội thoại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐÍNH KÈM SẢN PHẨM CỬA HÀNG */}
      {showProductPicker && (
        <div className="modal-overlay" onClick={() => setShowProductPicker(false)}>
          <div className="modal-card" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Chọn Sản Phẩm YOUTH FASHION</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowProductPicker(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="sidebar-search-box">
                <Search size={14} className="search-icon-inside" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm theo tên..."
                  className="search-input-field"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {loadingProducts ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>
                    Đang tải sản phẩm...
                  </div>
                ) : storeProducts.filter((p) =>
                    (p.product_name || p.name || '').toLowerCase().includes(productSearch.toLowerCase())
                  ).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>
                    Không tìm thấy sản phẩm nào
                  </div>
                ) : (
                  storeProducts
                    .filter((p) =>
                      (p.product_name || p.name || '').toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((prod) => {
                      const pImg = prod.images?.[0]?.image_url || prod.image || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800';
                      const pPrice = prod.price || (prod.variants?.[0]?.price ? Number(prod.variants[0].price) : 550000);
                      return (
                        <div
                          key={prod.product_id || prod.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #ECE7E1',
                            cursor: 'pointer',
                            background: '#FAF9F6',
                            transition: 'background 0.15s',
                          }}
                          onClick={() => {
                            if (showNewConvModal) {
                              setNewConvProduct({
                                id: prod.product_id || prod.id,
                                name: prod.product_name || prod.name,
                                price: pPrice,
                                image: pImg,
                                sku: `YF-${prod.product_id || prod.id}`,
                              });
                              setShowProductPicker(false);
                            } else {
                              handleSelectProductToAttach(prod);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={pImg}
                              alt=""
                              style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                {prod.product_name || prod.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#6B7280' }}>
                                {Number(pPrice).toLocaleString('vi-VN')}₫
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-new-conv"
                            style={{ padding: '6px 12px', fontSize: 11 }}
                          >
                            Đính kèm
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM ẢNH PHÓNG TO */}
      {lightboxImg && (
        <div className="modal-overlay" onClick={() => setLightboxImg(null)}>
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              animation: 'fadeIn 0.2s',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                position: 'absolute',
                top: -36,
                right: 0,
                color: '#FFFFFF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setLightboxImg(null)}
            >
              <X size={28} />
            </button>
            <img
              src={lightboxImg}
              alt="Phóng to"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
