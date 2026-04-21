//
//  CoachChatView.swift
//  Vibes Arc
//
//  Interface du chat Coach Vibes — parité avec la version web.
//

import SwiftUI
import UIKit

struct CoachChatView: View {
    @StateObject private var vm = CoachChatViewModel()
    @State private var input: String = ""
    @State private var showResetConfirm = false
    @FocusState private var inputFocused: Bool

    private let accent = Color(red: 0.47, green: 0.26, blue: 0.82)
    private let assistantGradient = LinearGradient(
        colors: [
            Color(red: 0.52, green: 0.25, blue: 0.91),
            Color(red: 0.86, green: 0.27, blue: 0.68)
        ],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()

            ScrollViewReader { proxy in
                ScrollView {
                    if vm.isInitialLoading {
                        ProgressView("Chargement…")
                            .padding(.top, 80)
                    } else if vm.messages.isEmpty {
                        emptyState
                            .padding(.top, 16)
                    } else {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(vm.messages) { message in
                                bubble(for: message)
                                    .id(message.id)
                                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                            }
                            if vm.isLoading {
                                typingIndicator
                                    .id("typing")
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                }
                .onChange(of: vm.messages.count) { _, _ in
                    scrollToBottom(proxy: proxy)
                }
                .onChange(of: vm.isLoading) { _, loading in
                    if loading {
                        withAnimation { proxy.scrollTo("typing", anchor: .bottom) }
                    }
                }
            }

            if let error = vm.error {
                errorBanner(error)
            }

            if let info = vm.infoMessage {
                infoBanner(info)
            }

            inputBar
        }
        .background(Color(.systemGroupedBackground).ignoresSafeArea())
        .task { await vm.loadHistory() }
        .navigationTitle("Coach")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog(
            "Effacer toute la conversation ?",
            isPresented: $showResetConfirm,
            titleVisibility: .visible
        ) {
            Button("Effacer", role: .destructive) {
                Task { await vm.reset() }
            }
            Button("Annuler", role: .cancel) {}
        } message: {
            Text("L'historique sera supprimé côté serveur et sur cet appareil.")
        }
    }

    // MARK: - Sections

    private var header: some View {
        HStack(spacing: 10) {
            Image(systemName: "sparkles")
                .foregroundStyle(assistantGradient)
                .font(.title3)

            VStack(alignment: .leading, spacing: 2) {
                Text("Coach Vibes")
                    .font(.headline)
                Text("En ligne · \(vm.provider.displayName)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Picker("Provider", selection: $vm.provider) {
                ForEach(AIProvider.allCases) { p in
                    Text(p.displayName).tag(p)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 150)

            Button {
                showResetConfirm = true
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.body)
                    .padding(8)
                    .background(Color(.systemGray5))
                    .clipShape(Circle())
            }
            .disabled(vm.isLoading || vm.messages.isEmpty)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.system(size: 36))
                    .foregroundStyle(assistantGradient)
                Text("Bonjour ! Je suis ton Coach Vibes.")
                    .font(.title3.bold())
                    .multilineTextAlignment(.center)
                Text("Dis-moi ce qui se passe, je suis là.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 28)

            let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(CoachSuggestions.all) { suggestion in
                    Button {
                        Task { await vm.send(suggestion.text) }
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(suggestion.emoji)
                                .font(.title3)
                            Text(suggestion.text)
                                .font(.caption)
                                .foregroundStyle(.primary)
                                .multilineTextAlignment(.leading)
                                .lineLimit(3)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .background(Color(.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(accent.opacity(0.15), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func bubble(for message: CoachMessage) -> some View {
        HStack(alignment: .bottom, spacing: 8) {
            if message.role == .user {
                Spacer(minLength: 40)
                userBubble(message)
            } else {
                assistantBubble(message)
                Spacer(minLength: 40)
            }
        }
    }

    private func userBubble(_ message: CoachMessage) -> some View {
        VStack(alignment: .trailing, spacing: 4) {
            Text(message.content)
                .font(.body)
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.indigo)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            Text(timeLabel(message.timestamp))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func assistantBubble(_ message: CoachMessage) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .top, spacing: 8) {
                Circle()
                    .fill(assistantGradient)
                    .frame(width: 28, height: 28)
                    .overlay(
                        Image(systemName: "sparkles")
                            .font(.caption)
                            .foregroundStyle(.white)
                    )
                Text(message.content)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .contextMenu {
                        Button {
                            UIPasteboard.general.string = message.content
                        } label: {
                            Label("Copier", systemImage: "doc.on.doc")
                        }
                        Button {
                            Task { await vm.saveInsight(from: message) }
                        } label: {
                            Label("Sauvegarder comme insight", systemImage: "bookmark.fill")
                        }
                    }
            }
            HStack(spacing: 6) {
                Text(timeLabel(message.timestamp))
                if let p = message.provider {
                    Text("·").foregroundStyle(.tertiary)
                    Text(p.displayName)
                }
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
            .padding(.leading, 36)
        }
    }

    private var typingIndicator: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(assistantGradient)
                .frame(width: 28, height: 28)
                .overlay(
                    Image(systemName: "sparkles")
                        .font(.caption)
                        .foregroundStyle(.white)
                )
            HStack(spacing: 4) {
                ForEach(0..<3) { index in
                    Circle()
                        .fill(Color.secondary)
                        .frame(width: 6, height: 6)
                        .opacity(0.6)
                        .scaleEffect(1)
                        .animation(
                            .easeInOut(duration: 0.6)
                                .repeatForever()
                                .delay(Double(index) * 0.15),
                            value: vm.isLoading
                        )
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            Spacer()
        }
    }

    private func errorBanner(_ error: CoachError) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)
            VStack(alignment: .leading, spacing: 4) {
                Text(error.errorDescription ?? "Erreur")
                    .font(.caption)
                    .foregroundStyle(.primary)
                if case .server = error {
                    Button("Réessayer") {
                        Task { await vm.retryLast() }
                    }
                    .font(.caption.bold())
                    .foregroundStyle(.red)
                }
            }
            Spacer()
            Button {
                vm.error = nil
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(Color.red.opacity(0.12))
    }

    private func infoBanner(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
            Text(text).font(.caption)
            Spacer()
            Button { vm.infoMessage = nil } label: {
                Image(systemName: "xmark").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.green.opacity(0.12))
    }

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Partage ce qui te passe par la tête…", text: $input, axis: .vertical)
                .lineLimit(1...5)
                .textInputAutocapitalization(.sentences)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .focused($inputFocused)
                .disabled(vm.isLoading)

            Button {
                let text = input
                input = ""
                inputFocused = false
                Task { await vm.send(text) }
            } label: {
                Image(systemName: "paperplane.fill")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(sendBackground)
                    .clipShape(Circle())
            }
            .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || vm.isLoading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }

    private var sendBackground: some View {
        Group {
            if input.trimmingCharacters(in: .whitespaces).isEmpty || vm.isLoading {
                Color.gray.opacity(0.4)
            } else {
                assistantGradient
            }
        }
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        guard let last = vm.messages.last else { return }
        withAnimation(.easeOut(duration: 0.25)) {
            proxy.scrollTo(last.id, anchor: .bottom)
        }
    }

    private func timeLabel(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

#Preview {
    NavigationStack { CoachChatView() }
}
