// Uncommented and fixed campaign loading functionality
document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".categories-link");
    const listContainer = document.getElementById("fundraiser-lists");
    const limit = document.querySelector("[data-limit]")?.dataset.limit || 10; // Fixed template variable reference

    // AJAX function to fetch campaigns
    function fetchCampaigns(category = "") {
        fetch(
            `/ajax/campaign?category=${
                category === "all" ? "" : category
            }&limit=${limit}`
        )
            .then((response) => response.text())
            .then((html) => {
                listContainer.innerHTML = html;
            })
            .catch((error) => {
                console.error("Error loading campaigns:", error);
            });
    }

    // Load initial campaigns only if container exists
    if (listContainer) {
        fetchCampaigns();
    }

    // Handle tab click
    tabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            // Set active tab
            tabs.forEach((t) => t.classList.remove("current"));
            this.classList.add("current");

            // Fetch category-specific campaigns
            const category = this.getAttribute("data-category");
            fetchCampaigns(category);
        });
    });
});

// Contact form handling
$(function () {
    $("#contact-info").on("submit", function (e) {
        e.preventDefault();

        const $form = $(this);
        const action = $form.attr("action");
        const formData = $form.serialize();

        // Reset previous errors
        $(".field-error").text("");
        $("#form-success-message").addClass("hidden").text("");

        $.ajax({
            url: action,
            method: "POST",
            data: formData,
            success: function (response) {
                if (response.success) {
                    $("#form-success-message")
                        .removeClass("hidden")
                        .text("Thank you! We'll be in touch shortly.");
                    $form[0].reset();
                } else if (response.error) {
                    // Show individual field errors
                    $.each(response.error, function (field, message) {
                        $(`[data-field="${field}"] .field-error`).text(message);
                    });
                }
            },
            error: function (err) {
                if (err?.responseJSON?.error) {
                    // Show individual field errors
                    $.each(err.responseJSON.error, function (field, message) {
                        $(`[data-field="${field}"] .field-error`).text(message);
                    });
                } else {
                    // General error message
                    $("#form-success-message")
                        .removeClass("hidden text-green-600")
                        .addClass("text-red-600")
                        .text("Something went wrong. Please try again later.");
                }
            },
        });
    });
});

// Hero form handling
$(function () {
    $("#funding-form").on("submit", function (e) {
        e.preventDefault();

        const $form = $(this);
        const action = $form.attr("action");
        const formData = $form.serialize();

        $(".field-error").text("");
        $("#funding-form-success").addClass("hidden").text("");

        $.ajax({
            url: action,
            method: "POST",
            data: formData,
            success: function (res) {
                if (res.success) {
                    $("#funding-form-success")
                        .removeClass("hidden")
                        .text("Thanks! Your form has been submitted.");

                    $form[0].reset();

                    // Clear success message after 5 seconds
                    setTimeout(function () {
                        $("#funding-form-success").addClass("hidden").text("");
                    }, 3000);
                } else if (res.error) {
                    $.each(res.error, function (field, message) {
                        $(`[data-field="${field}"] .field-error`).text(message);
                    });
                }
            },
            error: function (err) {
                if (err?.responseJSON?.error) {
                    $.each(err.responseJSON.error, function (field, message) {
                        $(`[data-field="${field}"] .field-error`).text(message);
                    });
                } else {
                    $("#funding-form-success")
                        .removeClass("hidden text-green-600")
                        .addClass("text-red-600")
                        .text("Something went wrong. Please try again.");

                    // Clear error after 5 seconds
                    setTimeout(function () {
                        $("#funding-form-success").addClass("hidden").text("");
                    }, 3000);
                }
            },
        });
    });
});

$(document).on("submit", "#newsletter-form", function (e) {
    e.preventDefault();
    const $form = $(this);
    const email = $form.find("#email").val();
    var $message = $form.find(".form-message");

    $.ajax({
        url: "/newsletter-check",
        method: "get",
        data: {
            email: email,
        },
        dataType: "json",
        success: function (response) {
            // You get a JSON response from Statamic
            if (response.status === true) {
                $message
                    .text(response.message)
                    .css("color", "#f8d419")
                    .fadeIn();
                $form[0].reset();
                setTimeout(() => {
                    $message.text(response.message).text("").fadeOut();
                }, 3000);
            } else {
                $message
                    .text(response.message)
                    .css("color", "#df5243")
                    .fadeIn();

                setTimeout(() => {
                    $message.text(response.message).text("").fadeOut();
                }, 3000);
            }
        },
        error: function (response) {},
    });
});

// Form toggle logic for login, register, and forgot password forms
document.addEventListener("DOMContentLoaded", function () {
    // ======== Form Toggle Logic ========
    const loginForm = document.getElementById("customerLoginForm");
    const registerForm = document.getElementById("registerForm");
    const forgotForm = document.getElementById("forgotPasswordForm");

    function showForm(target) {
        loginForm.classList.add("hidden");
        registerForm.classList.add("hidden");
        forgotForm.classList.add("hidden");

        if (target === "login") loginForm.classList.remove("hidden");
        else if (target === "register") registerForm.classList.remove("hidden");
        else if (target === "forgot") forgotForm.classList.remove("hidden");
    }

    document.querySelectorAll(".toggle-login").forEach((el) =>
        el.addEventListener("click", (e) => {
            e.preventDefault();
            showForm("login");
        })
    );

    document.querySelectorAll(".toggle-register").forEach((el) =>
        el.addEventListener("click", (e) => {
            e.preventDefault();
            showForm("register");
        })
    );

    document.querySelectorAll(".toggle-forgot").forEach((el) =>
        el.addEventListener("click", (e) => {
            e.preventDefault();
            showForm("forgot");
        })
    );

    // ======== Forgot Password (Fetch) ========
    const form = document.getElementById("forgotPasswordForm");
    if (form) {
        const submitBtn = form.querySelector("button[type='submit']");
        const emailInput = form.querySelector('input[name="forget_email"]');

        const messageBox = document.createElement("div");
        messageBox.className = "text-sm mt-3 font-medium";
        form.querySelector(".forgotPasswordForm").appendChild(messageBox);

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const email = emailInput.value.trim();
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";

            fetch("/forgot-password", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                }),
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) {
                        const msg =
                            data?.errors?.email?.[0] ||
                            data?.message ||
                            "Something went wrong.";
                        showMessage(msg, "red");
                    } else {
                        showMessage(
                            data.message || "Reset link sent to your email.",
                            "green"
                        );
                        form.reset();
                    }
                })
                .catch(() => {
                    showMessage("Server error. Please try again later.", "red");
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit";
                });

            function showMessage(msg, color = "red") {
                messageBox.textContent = msg;
                messageBox.style.color =
                    color === "red" ? "#dc2626" : "#059669";
                setTimeout(() => {
                    messageBox.textContent = "";
                }, 3000);
            }
        });
    }
});
// Register and Login Forms
$(document).ready(function () {
    // ========== Register Form ==========
    const $registerForm = $("#registerForm");
    const $registerResponse = $("#registerResponse");
    const $registerBtn = $registerForm.find('button[type="submit"]');

    if ($registerForm.length) {
        $registerForm.on("submit", function (e) {
            e.preventDefault();
            $registerForm.find(".field-error").remove();
            $registerResponse.hide().text("");
            $registerBtn.prop("disabled", true);

            const formData = new FormData(this);

            $.ajax({
                url: "/customer/register",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr(
                        "content"
                    ),
                    "X-Requested-With": "XMLHttpRequest",
                },
                success: function (data) {
                    $registerResponse
                        .show()
                        .css("background-color", "#186f65")
                        .text(
                            data.message?.trim() ||
                                "Registration successful! Redirecting..."
                        );

                    $registerForm[0].reset();

                    setTimeout(() => {
                        $registerResponse.hide();
                        $registerForm.hide();
                        $("#customerLoginForm").show();
                    }, 2000);
                },
                error: function (xhr) {
                    const data = xhr.responseJSON;

                    if (data?.errors) {
                        $.each(data.errors, function (field, messages) {
                            const $input = $registerForm.find(
                                `[name="${field}"]`
                            );
                            const $group = $input.closest(".register-input");

                            if (!$group.find(".field-error").length) {
                                const $error = $(
                                    '<div class="field-error text-danger mt-1 text-sm" style="color:red;"></div>'
                                ).text(messages[0]);
                                $group.append($error);
                            }
                        });

                        setTimeout(() => {
                            $registerForm.find(".field-error").remove();
                        }, 5000);
                    } else {
                        $registerResponse
                            .show()
                            .css("background-color", "#a94442")
                            .text(
                                data?.message?.trim() || "Something went wrong."
                            );
                    }

                    setTimeout(() => $registerResponse.fadeOut(), 5000);
                },
                complete: function () {
                    $registerBtn.prop("disabled", false);
                },
            });
        });
    }

    // ========== Login Form ==========
    const $loginForm = $("#customerLoginForm");
    const $loginResponse = $("#loginResponse");
    const $loginBtn = $loginForm.find('button[type="submit"]');

    if ($loginForm.length) {
        $loginForm.on("submit", function (e) {
            e.preventDefault();
            $loginForm.find(".field-error").remove();
            $loginResponse.hide().text("");
            $loginBtn.prop("disabled", true).text("Logging in...");

            const formData = new FormData(this);

            $.ajax({
                url: "/customer/login",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr(
                        "content"
                    ),
                    "X-Requested-With": "XMLHttpRequest",
                },
                success: function (data) {
                    $loginResponse
                        .show()
                        .css("background-color", "#186f65")
                        .text(data.message?.trim() || "Login successful");

                    setTimeout(() => {
                        window.location.href = "/";
                    }, 500);
                },
                error: function (xhr) {
                    const data = xhr.responseJSON;

                    if (data?.errors) {
                        $.each(data.errors, function (field, messages) {
                            const $input = $loginForm.find(`[name="${field}"]`);
                            const $group = $input.closest(".login-input");

                            if (!$group.find(".field-error").length) {
                                const $error = $(
                                    '<div class="field-error text-danger mt-1 text-sm" style="color:red;"></div>'
                                ).text(messages[0]);
                                $group.append($error);
                            }
                        });
                    } else {
                        $loginResponse
                            .show()
                            .css("background-color", "#a94442")
                            .text(
                                data.message?.trim() ||
                                    "Invalid credentials or an error occurred."
                            );
                    }

                    setTimeout(() => {
                        $loginResponse.fadeOut();
                        $loginForm.find(".field-error").fadeOut().remove();
                    }, 5000);
                },
                complete: function () {
                    $loginBtn.prop("disabled", false).text("Login");
                },
            });
        });
    }
});

// Account functionality
// Logout confirmation
$(document).on("click", "a.logout", function (e) {
    const confirmed = confirm("Are you sure you want to log out?");
    if (!confirmed) {
        e.preventDefault();
    }
});

// Profile update form
$(document).ready(function () {
    const $form = $("#updateProfileForm");
    const $responseBox = $("#updateResponse");

    if (!$form.length || !$responseBox.length) return;

    $form.on("submit", function (e) {
        e.preventDefault();
        $(".field-error").remove();
        $responseBox.hide().removeClass("hidden");
        $form.find('.spinner').css('display','block');
        const formData = new FormData(this);

        $.ajax({
            url: "/customer/update",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                "X-Requested-With": "XMLHttpRequest",
            },
            success: function (data) {
                $form.find('.spinner').css('display','none');
                $responseBox
                    .text(data.message || "Profile updated successfully!")
                    .fadeIn();

                $responseBox[0].style.color = "green";
            },
            error: function (xhr) {
                $form.find('.spinner').css('display','none');
                const data = xhr.responseJSON;

                if (data?.errors) {
                    $.each(data.errors, function (field, messages) {
                        const $input = $(`[name="${field}"]`);
                        if ($input.length) {
                            const $error = $(
                                '<div class="field-error text-sm mt-1"></div>'
                            )
                                .text(messages[0])
                                .css("color", "red");
                            $input.closest(".input-wrap").append($error);
                        }
                    });
                }
            },
        });

        // Hide message after 4 seconds
        setTimeout(() => {
            $responseBox.fadeOut();
        }, 4000);
    });
});

// Profile image upload and donation pagination
document.addEventListener("DOMContentLoaded", function () {
    const trigger = document.getElementById("triggerImageUpload");
    const input = document.getElementById("profileImageInput");
    const preview = document.getElementById("profilePreview");
    const form = document.getElementById("profileImageForm");
    const status = document.getElementById("uploadStatus");

    if (trigger && input && preview && form && status) {
        trigger.addEventListener("click", function (e) {
            e.preventDefault();
            input.click();
        });

        input.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;

            // Preview image immediately
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Build FormData for AJAX
            const formData = new FormData(form);
            formData.append("profile_image", file);

            // Send via fetch (AJAX)
            fetch("/update-profile-image", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'input[name="_token"]'
                    ).value,
                },
                body: formData,
            })
                .then((response) =>
                    response.ok ? response.json() : Promise.reject(response)
                )
                .then((data) => {
                    status.textContent = "Profile image updated successfully!";
                    status.style.color = "green";
                    status.style.display = "block";
                })
                .catch((error) => {
                    console.error("Upload error:", error);
                    status.textContent =
                        "Image upload failed. Please try again.";
                    status.style.color = "red";
                    status.style.display = "block";
                });

            // Hide after 4 seconds
            setTimeout(() => {
                status.style.display = "none";
            }, 4000);
        });
    }

    // Donation pagination
    const wrapper = document.getElementById("donation-list-wrapper");

    if (wrapper) {
        function bindPaginationEvents() {
            const links = wrapper.querySelectorAll(".pagination-link");
            links.forEach((link) => {
                link.removeEventListener("click", handlePaginationClick);
                link.addEventListener("click", handlePaginationClick);
            });
        }

        function handlePaginationClick(e) {
            e.preventDefault();

            const link = e.currentTarget;
            let url = link.getAttribute("data-url");
            if (!url) return;

            // Force HTTPS if in production environment
            const appEnv = document
                .querySelector('meta[name="app-env"]')
                ?.getAttribute("content");
            if (appEnv === "production" && url.startsWith("http:")) {
                url = url.replace(/^http:/, "https:");
            }

            fetch(url, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                },
            })
                .then((res) => res.text())
                .then((html) => {
                    const temp = document.createElement("div");
                    temp.innerHTML = html;
                    const newContent = temp.querySelector(
                        "#donation-list-wrapper"
                    );
                    if (newContent) {
                        wrapper.innerHTML = newContent.innerHTML;
                        bindPaginationEvents(); // rebind new links
                    }
                })
                .catch((err) => {
                    console.error(
                        "Failed to load donation page via AJAX:",
                        err
                    );
                });
        }

        bindPaginationEvents();
    }
});

// Payment form handling
document.addEventListener("DOMContentLoaded", function () {
    // ✅ Only run on /payment-detail page
    const allowedPaths = ["/donation"];
    const currentPath = window.location.pathname;

    if (!allowedPaths.includes(currentPath)) return;

    // --- Helper: Get cookie value ---
    function getCookie(name) {
        const match = document.cookie.match(
            new RegExp("(^| )" + name + "=([^;]+)")
        );
        return match ? decodeURIComponent(match[2]) : null;
    }

    // --- Get required cookie values ---
    const amount = getCookie("amount");
    const currency = getCookie("currency");
    const fundType = getCookie("pay_type");

    if (!amount || !currency || !fundType) {
        window.location.href = "/";
        return;
    }

    // --- Autofill values ---
    const amountInput = document.getElementById("amount");
    const currencyInput = document.getElementById("currency");
    const currencyValueInput = document.getElementById("currency-value");
    const paytype = document.getElementById("pay_type");

    if (amountInput) amountInput.value = amount;
    if (currencyInput) currencyInput.value = currency;
    if (currencyValueInput) currencyValueInput.value = currency;
    if (paytype) paytype.textContent = fundType;

    // --- Ensure campaign_id is in URL if stored in cookie ---
    const url = new URL(window.location.href);
    const queryId = url.searchParams.get("campaign_id");

    if (!queryId) {
        const campaignId = getCookie("campaign_id");

        if (campaignId && campaignId !== "null" && campaignId !== "undefined") {
            url.searchParams.set("campaign_id", campaignId);
            window.location.replace(url.toString()); // avoid back navigation issues
            return;
        }
    }

    // ✅ Now check if campaign exists (DOM-based check)
    const campaignCard = document.querySelector(".fundraiser-item");

    if (queryId && !campaignCard) {
        window.location.href = "/";
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("paymentForm");
    if (!form) return;

    function getCookie(name) {
        const match = document.cookie.match(
            new RegExp("(^| )" + name + "=([^;]+)")
        );
        return match ? decodeURIComponent(match[2]) : null;
    }

    const currency = getCookie("currency") || "INR";
    const payType = getCookie("pay_type") || "One Time Funding";
    const razorpayOption = document.querySelector("#gateway-razorpay");
    const stripeOption = document.querySelector("#gateway-stripe");

    if (payType === "Monthly Funding" && currency !== "INR") {
        if (razorpayOption)
            razorpayOption.closest("label").style.display = "none";
        if (stripeOption) stripeOption.checked = true;
    } else {
        if (razorpayOption)
            razorpayOption.closest("label").style.display = "block";
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const gateway = document.querySelector(
            'input[name="payment_gateway"]:checked'
        )?.value;
        if (!gateway) return alert("Please select a payment gateway.");

        const username = document.getElementById("username")?.value.trim();
        const user_name = document.getElementById("user_name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const phone = document.getElementById("phonenumber")?.value.trim();
        const pan = document.getElementById("taxid")?.value.trim();
        const amount =
            parseFloat(document.getElementById("amount")?.value.trim()) || 0;
        const campaignId = getCookie("campaign_id");
        const csrf = window.APP_CONFIG?.csrf;
        if (!csrf) return alert("CSRF token missing. Please refresh.");

        $('#submitBtn').find('.loader.small').css('display', 'block'); 

        const validateRes = await fetch("/validate-donation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrf,
            },
            body: JSON.stringify({
                username,
                user_name,
                email,
                phonenumber: phone,
                pan,
                amount,
                currency,
            }),
        });

        const validation = await validateRes.json();
        if (validation.status === "error") {
            $('#submitBtn').find('.loader.small').css('display', 'none'); 
            Object.entries(validation.errors).forEach(([field, [msg]]) => {
                const id = field === "pan" ? "taxid-error" : `${field}-error`;
                const el = document.getElementById(id);
                if (el) {
                    el.innerText = msg;
                    el.style.display = "block";
                }
            });
            return;
        }
        $('#submitBtn').find('.loader.small').css('display', 'none'); 
        // Razorpay - Monthly Subscription (INR only)
        if (gateway === "razorpay" && payType === "Monthly Funding") {
            const subRes = await fetch("/create-razorpay-subscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf,
                },
                body: JSON.stringify({
                    amount,
                    currency,
                    email,
                    phone,
                    pan,
                    full_name: user_name,
                    campaign_id: campaignId,
                }),
            });

            const { subscription_id } = await subRes.json();
            if (!subscription_id)
                return alert("Subscription failed. Please try again.");

            const rzp = new Razorpay({
                key: window.APP_CONFIG.razorpay_key,
                subscription_id,
                name: "GoLifespan",
                description: "Monthly Donation",
                prefill: {
                    name: user_name,
                    email: email,
                    contact: phone,
                },
                notes: {
                    subscription_id,
                    full_name: user_name,
                    donor_email: email,
                    donor_phone: phone,
                    pan: pan,
                    pay_type: payType,
                    campaign_id: campaignId,
                },
                handler: function () {
                    $('#submitBtn').find('.loader.small').css('display', 'none'); 
                    window.location.href = `/payment-status?order_id=${subscription_id}`;
                },
            });

            rzp.open();
            return;
        }

        // Razorpay - One Time
        if (gateway === "razorpay") {
            const orderRes = await fetch("/create-razorpay-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf,
                },
                body: JSON.stringify({
                    amount,
                    currency,
                }),
            });

            const { order_id, amount: finalAmount } = await orderRes.json();
            if (!order_id) return alert("Order creation failed.");

            const rzp = new Razorpay({
                key: window.APP_CONFIG.razorpay_key,
                order_id,
                amount: finalAmount,
                currency,
                name: "GoLifespan",
                description: "Donation",
                prefill: {
                    name: user_name,
                    email: email,
                    contact: phone,
                },
                notes: {
                    full_name: user_name,
                    donor_email: email,
                    donor_phone: phone,
                    pan: pan,
                    pay_type: payType,
                    campaign_id: campaignId,
                },
                handler: function (response) {
                    $('#submitBtn').find('.loader.small').css('display', 'none'); 
                    window.location.href = `/payment-status?order_id=${order_id}`;
                },
            });

            rzp.open();
            return;
        }

        // Stripe fallback
        if (gateway === "stripe") {
            if (typeof Stripe === "undefined")
                return alert("Stripe SDK not loaded.");
            const stripe = Stripe(window.APP_CONFIG.stripe_key);

            const isMonthly = payType.toLowerCase().includes("monthly");
            const endpoint = isMonthly
                ? "/create-monthly-subscription"
                : "/create-stripe-session";

            const stripeSessionRes = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf,
                },
                body: JSON.stringify({
                    amount,
                    currency,
                    email,
                    name: user_name,
                    phone,
                    pan,
                    campaign_id: campaignId,
                    pay_type: payType,
                }),
            });

            const session = await stripeSessionRes.json();
            if (session.session_id || session.id) {
                stripe.redirectToCheckout({
                    sessionId: session.session_id || session.id,
                });
            } else {
                alert("Stripe session creation failed.");
            }
        }
    });
});

// Common utility functions

function toggleShareDropdown(button) {
    const dropdown = button.parentElement.nextElementSibling;
    document.querySelectorAll(".share-dropdown").forEach((el) => {
        if (el !== dropdown) el.classList.add("hidden");
    });
    dropdown.classList.toggle("hidden");
}

// Monthly donor stats
document.addEventListener("DOMContentLoaded", function () {
    const monthlyDonorElement = document.getElementById("monthly-donor-count");

    if (monthlyDonorElement) {
        fetch("/monthly-donor-stats")
            .then((res) => res.json())
            .then((data) => {
                monthlyDonorElement.textContent = `*${data.count} People started donating every month`;
            })
            .catch((error) => {
                console.error("Failed to fetch monthly donor stats:", error);
            });
    }
});

// Funding banner functionality
document.addEventListener("DOMContentLoaded", () => {
    const exchangeRates = {};
    const currencySymbols = {};

    // Load exchange rates and symbols from <ul>
    const exchangeRatesList = document.querySelectorAll("#exchange-rates li");
    if (exchangeRatesList.length === 0) {
        console.warn("Exchange rates list not found");
        return;
    }

    exchangeRatesList.forEach((li) => {
        const currency = li.dataset.currency;
        const symbol = li.dataset.symbol || "";
        const rate = parseFloat(li.textContent);

        if (currency && !isNaN(rate)) {
            exchangeRates[currency] = rate;
            currencySymbols[currency] = symbol;
        }
    });

    // Read selected currency from cookie
    const selectedCurrency = getCookie("selected_currency") || "INR";

    // Read customer login status
    const isCustomerLoggedIn =
        document
            .querySelector('meta[name="customer-logged-in"]')
            ?.getAttribute("content") === "true";

    // Handle tab switching
    document.querySelectorAll(".button-link").forEach((tab) => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-tab");

            document
                .querySelectorAll(".button-link")
                .forEach((t) => t.classList.remove("current"));
            document.querySelectorAll(".tabs-content").forEach((c) => {
                c.classList.add("hidden");
                c.classList.remove("block");
            });

            tab.classList.add("current");
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove("hidden");
                targetContent.classList.add("block");
            }
        });
    });

    // Initialize all tabs
    document.querySelectorAll(".tabs-content").forEach((content) => {
        const fundType = content.id;
        if (fundType) {
            initializeTab(fundType);
        }
    });

    // Tab logic
    function initializeTab(fundType) {
        const currencySelect = document.getElementById(`currency-${fundType}`);
        const customAmountInput = document.getElementById(
            `customAmount-${fundType}`
        );
        const radioInputs = document.querySelectorAll(
            `input[name="amount-${fundType}"]`
        );
        const radioLabels = document.querySelectorAll(
            `.selectamount[data-fund-type="${fundType}"]`
        );
        const displayAmount = document.getElementById(
            `displayAmount-${fundType}`
        );
        const payBtn = document.getElementById(`payBtn-${fundType}`);
        const errorBox = document.getElementById(`amountError-${fundType}`);

        if (!currencySelect || !customAmountInput || !displayAmount || !payBtn)
            return;

        // Set dropdown to selected currency
        currencySelect.value = selectedCurrency;

        // Update all label amounts based on selected currency
        function updateRadioLabels() {
            const rate = exchangeRates[currencySelect.value] || 1;
            const symbol = currencySymbols[currencySelect.value] || "";

            radioLabels.forEach((label) => {
                const baseAmount = parseFloat(label.dataset.amount);
                if (!isNaN(baseAmount)) {
                    const converted = (baseAmount / rate).toFixed(2);
                    label.textContent = `${symbol}${converted}`;
                }
            });
        }

        // If a radio is selected, update custom amount field
        function updateCustomAmount() {
            const checked = document.querySelector(
                `input[name="amount-${fundType}"]:checked`
            );
            const rate = exchangeRates[currencySelect.value] || 1;

            if (checked) {
                const baseAmount = parseFloat(checked.value);
                if (!isNaN(baseAmount)) {
                    const converted = (baseAmount / rate).toFixed(2);
                    customAmountInput.value = converted;
                    displayAmount.innerText = converted;
                }
            }
        }

        // On manual amount input
        customAmountInput.addEventListener("input", () => {
            displayAmount.innerText = customAmountInput.value || "0.00";
            radioInputs.forEach((r) => (r.checked = false));
            if (errorBox) errorBox.textContent = "";
        });

        // On currency change within this tab only
        currencySelect.addEventListener("change", () => {
            updateRadioLabels();
            updateCustomAmount();
        });

        // On radio selection
        radioInputs.forEach((input) => {
            input.addEventListener("change", () => {
                updateCustomAmount();
                if (errorBox) errorBox.textContent = "";
            });
        });

        // On pay click
        payBtn.addEventListener("click", () => {
            const checkedRadio = document.querySelector(
                `input[name="amount-${fundType}"]:checked`
            );
            const enteredAmount = customAmountInput.value.trim();
            const currency = currencySelect.value;
            let amount = "";

            if (checkedRadio) {
                amount = parseFloat(customAmountInput.value).toFixed(2);
            } else if (enteredAmount && parseFloat(enteredAmount) > 0) {
                amount = parseFloat(enteredAmount).toFixed(2);
            }

            if (!amount || parseFloat(amount) <= 0) {
                if (errorBox)
                    errorBox.textContent =
                        "Please enter or select a valid amount.";
                return;
            }

            // ✅ Block monthly donation if customer not logged in
            if (fundType === "Monthly Funding" && !isCustomerLoggedIn) {
                $.magnificPopup.open({
                    items: {
                        src: "#login-form",
                        type: "inline",
                    },
                });
                return;
            }

            // Save cookies
            document.cookie = `amount=${amount}; path=/`;
            document.cookie = `currency=${currency}; path=/`;
            document.cookie = `pay_type=${fundType}; path=/`;
            document.cookie = `campaign_id=${null}; path=/`;

            // Redirect to donation page
            window.location.href = "/donation";
        });

        // ✅ Select the first radio by default if none selected
        if (
            radioInputs.length > 0 &&
            !document.querySelector(`input[name="amount-${fundType}"]:checked`)
        ) {
            radioInputs[0].checked = true;
        }

        updateRadioLabels();
        updateCustomAmount();
    }

    // Read cookie helper
    function getCookie(name) {
        const match = document.cookie.match(
            new RegExp("(^| )" + name + "=([^;]+)")
        );
        return match ? decodeURIComponent(match[2]) : null;
    }
});

//  compaing show & form rcuring js start {

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("donation-wrapper")) return;

    const exchangeRates = {};
    const currencySymbols = {};
    const key = "selected_currency";

    // 1. Load exchange rates & symbols from hidden list
    document.querySelectorAll("#exchange-rates li").forEach((li) => {
        const currency = li.dataset.currency;
        const rate = parseFloat(li.textContent);
        const symbol = li.dataset.symbol || "";
        if (currency && !isNaN(rate)) {
            exchangeRates[currency] = rate;
            currencySymbols[currency] = symbol;
        }
    });

    const currencySelect = document.querySelector(".currencys");
    const customAmountInput = document.getElementById("customAmount");
    const radioInputs = document.querySelectorAll('input[name="amount"]');
    const radioLabels = document.querySelectorAll(".selectamount");
    const displayAmount = document.getElementById("displayAmount");
    const payBtn = document.getElementById("payBtn");
    const errorBox = document.getElementById("amountError");
    const campaignId = document.getElementById("campaign_id")?.value || null;

    // 2. Read saved currency from cookie, default to INR
    const savedCurrency = getCookie(key) || "INR";
    if (currencySelect) currencySelect.value = savedCurrency;

    // ✅ Set cookie helper
    function setCookie(name, value, days = 30) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(
            value
        )}; path=/; expires=${expires}`;
    }

    // 3. Update radio button labels
    function updateLabels() {
        const selected = currencySelect.value;
        const rate = exchangeRates[selected] || 1;
        const symbol = currencySymbols[selected] || "";

        radioLabels.forEach((label) => {
            const baseAmount = parseFloat(label.dataset.amount);
            if (!isNaN(baseAmount)) {
                const converted = (baseAmount / rate).toFixed(2);
                label.textContent = `${symbol} ${converted}`;
            }
        });
    }

    // 4. Update displayed and input amounts
    function updateAmount() {
        const selected = currencySelect.value;
        const rate = exchangeRates[selected] || 1;
        const symbol = currencySymbols[selected] || "";
        const selectedRadio = document.querySelector(
            'input[name="amount"]:checked'
        );
        const enteredAmount = parseFloat(customAmountInput.value);

        let finalAmount = 0;

        if (selectedRadio) {
            finalAmount = parseFloat(selectedRadio.value) / rate;
            customAmountInput.value = finalAmount.toFixed(2);
        } else if (!isNaN(enteredAmount)) {
            finalAmount = enteredAmount;
        }

        displayAmount.textContent = `${symbol} ${
            isNaN(finalAmount) ? "0.00" : finalAmount.toFixed(2)
        }`;

        if (errorBox) errorBox.classList.add("hidden");
    }

    // 5. Select first radio by default
    if (radioInputs.length > 0) {
        radioInputs[0].checked = true;
    }

    // 6. Radio button selection
    radioInputs.forEach((input) => {
        input.addEventListener("change", updateAmount);
    });

    // 7. Manual input
    customAmountInput?.addEventListener("input", () => {
        radioInputs.forEach((r) => (r.checked = false));
        updateAmount();
    });

    // 8. Currency change: update labels, amount & set cookie
    currencySelect?.addEventListener("change", () => {
        const selected = currencySelect.value;
        setCookie(key, selected); // ✅ Set cookie
        updateLabels();
        updateAmount();
    });

    // 9. Pay button
    payBtn?.addEventListener("click", () => {
        const currency = currencySelect.value;
        const rate = exchangeRates[currency] || 1;
        const selectedRadio = document.querySelector(
            'input[name="amount"]:checked'
        );
        const enteredAmount = parseFloat(customAmountInput.value.trim());
        const isCustomerLoggedIn =
            document
                .querySelector('meta[name="customer-logged-in"]')
                ?.getAttribute("content") === "true";

        let amount = "";

        if (selectedRadio) {
            amount = (parseFloat(selectedRadio.value) / rate).toFixed(2);
        } else if (!isNaN(enteredAmount) && enteredAmount > 0) {
            amount = enteredAmount.toFixed(2);
        }

        if (!amount || parseFloat(amount) <= 0) {
            if (errorBox) {
                errorBox.textContent = "Please enter or select a valid amount.";
                errorBox.classList.remove("hidden");
            }
            return;
        }

        const isMonthly = !campaignId;

        // ✅ Check login for monthly donation
        if (isMonthly && !isCustomerLoggedIn) {
            $.magnificPopup.open({
                items: {
                    src: "#login-form",
                    type: "inline",
                },
            });
            return;
        }

        // ✅ Set donation cookies
        setCookie("amount", amount);
        setCookie("currency", currency);
        setCookie(
            "pay_type",
            isMonthly ? "Monthly Funding" : "One Time Funding"
        );
        if (campaignId) {
            setCookie("campaign_id", campaignId);
        } else {
            setCookie("campaign_id", null);
        }

        // ✅ Redirect to payment
        window.location.href = `/donation`;
    });

    // 10. Init
    updateLabels();
    updateAmount();

    // ✅ Get cookie helper
    function getCookie(name) {
        const match = document.cookie.match(
            new RegExp("(^| )" + name + "=([^;]+)")
        );
        return match ? decodeURIComponent(match[2]) : null;
    }
});

$(document).on("click", ".pagination-btn", function (e) {
    e.preventDefault();
    let url = $(this).data("page");

    // ✅ Force HTTPS in production
    const isProduction =
        $('meta[name="app-env"]').attr("content") === "production";
    if (isProduction && url.startsWith("http:")) {
        url = url.replace(/^http:/, "https:");
    }

    // ✅ AJAX request
    $.ajax({
        url: url,
        type: "GET",
        beforeSend: function () {
            $("#contributors-list-wrapper").html(
                '<p class="text-center py-10">Loading...</p>'
            );
        },
        success: function (response) {
            const html = $("<div>").html(response);
            const updatedList = html.find("#contributors-list-wrapper").html();
            $("#contributors-list-wrapper").html(updatedList);

            // Optional: Scroll to top of the list
            // $('html, body').animate({
            //     scrollTop: $("#contributors-list-wrapper").offset().top - 100
            // }, 300);
        },
        error: function () {
            $("#contributors-list-wrapper").html(
                '<p class="text-center text-red-500">Failed to load data.</p>'
            );
        },
    });
});

//  compaing show & form rcuring js end }

//campaing show

document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.getElementById("commentsWrapper");
    const commentForm = document.getElementById("commentForm");
    const responseBox = document.getElementById("commentResponse");
    let pageUrl = document.getElementById("page-url")?.getAttribute("data-url");

    const isProduction =
        document
            .querySelector('meta[name="app-env"]')
            ?.getAttribute("content") === "production";

    if (isProduction && pageUrl?.startsWith("http:")) {
        pageUrl = pageUrl.replace(/^http:/, "https:");
    }

    commentForm?.addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(commentForm);
        let url = "/comments";

        if (isProduction && url.startsWith("http:")) {
            url = url.replace(/^http:/, "https:");
        }

        fetch(url, {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-TOKEN": document.querySelector('input[name="_token"]')
                    .value,
            },
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message) {
                    responseBox.textContent = data.message;
                    responseBox.classList.remove("hidden");
                    responseBox.style.color = "green";
                    commentForm.reset();
                    refreshComments(formData.get("post"));
                } else {
                    responseBox.textContent = "Failed to submit comment.";
                    responseBox.style.color = "red";
                    responseBox.classList.remove("hidden");
                }
            })
            .catch(() => {
                responseBox.textContent = "Something went wrong.";
                responseBox.style.color = "red";
                responseBox.classList.remove("hidden");
            });

        setTimeout(() => {
            responseBox.textContent = "";
            responseBox.classList.add("hidden");
        }, 3000);
    });

    function refreshComments(entryId) {
        fetch(forceHttps(pageUrl), {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        })
            .then((res) => res.text())
            .then((html) => {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                const newContent = tempDiv.querySelector("#commentsContent");
                if (newContent) {
                    wrapper.querySelector("#commentsContent").innerHTML =
                        newContent.innerHTML;
                    bindPaginationEvents();
                }
            });
    }

    function handlePaginationClick(e) {
        const link = e.target.closest(".pagination-link");
        if (!link) return;
        e.preventDefault();

        let url = link.getAttribute("data-url");
        if (!url) return;

        url = forceHttps(url);

        fetch(url, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        })
            .then((res) => res.text())
            .then((html) => {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                const newContent = tempDiv.querySelector("#commentsContent");
                if (newContent) {
                    wrapper.querySelector("#commentsContent").innerHTML =
                        newContent.innerHTML;
                    bindPaginationEvents();
                }
            })
            .catch((error) =>
                console.error("AJAX error loading comments:", error)
            );
    }

    function bindPaginationEvents() {
        const links = wrapper?.querySelectorAll(".pagination-link");
        links?.forEach((link) => {
            link.removeEventListener("click", handlePaginationClick);
            link.addEventListener("click", handlePaginationClick);
        });
    }

    function forceHttps(url) {
        return isProduction && url?.startsWith("http:")
            ? url.replace(/^http:/, "https:")
            : url;
    }

    bindPaginationEvents();

    // --- Live Countdown Timer ---
    function updateCountdown() {
        const countdownElements = document.querySelectorAll(".live-countdown");

        countdownElements.forEach((element) => {
            const endDate = new Date(element.dataset.endDate);
            const now = new Date();
            const timeDiff = endDate - now;

            const total = parseFloat(element.dataset.total);
            const raised = parseFloat(element.dataset.raised);
            const percentage = (raised / total) * 100;

            if (timeDiff <= 0 || percentage >= 100) {
                element.innerHTML = `<span class="expired bg-primary-800 px-2.5 py-2 font-semibold text-sm rounded"><img src="../assets/images/golife-flower.svg" class="inline-block align-sub mb-px mr-1">Campaign is Over</span>`;
                document
                    .querySelectorAll(".Donate")
                    .forEach((btn) => (btn.style.display = "none"));
                // document.querySelectorAll(".campaign-over").forEach((el) => {
                //     el.innerHTML = "🎉 Campaign is over!";
                //     el.classList.remove("hidden");
                // });
            } else {
                const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                element.innerHTML = `<span class="days">${daysLeft}</span> Day${
                    daysLeft > 1 ? "s" : ""
                } Left`;
            }
        });
    }

    updateCountdown();
    setInterval(updateCountdown, 3600000); // every hour
});

document.addEventListener("DOMContentLoaded", function () {
    // Tab functionality
    const tabs = document.querySelectorAll(".button-link");
    const contents = document.querySelectorAll(".tabs-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const targetId = tab.getAttribute("data-tab");

            tabs.forEach((t) => t.classList.remove("current"));
            contents.forEach((c) => {
                c.classList.add("hidden");
                c.classList.remove("block");
            });
            tab.classList.add("current");
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove("hidden");
                targetContent.classList.add("block");
            }
        });
    });
});

// reset password
$(document).ready(function () {
    const $form = $("form[action='/reset-password']");
    if (!$form.length) return;

    const $submitBtn = $form.find("button[type='submit']");

    $form.on("submit", function (e) {
        e.preventDefault();

        $form.find(".field-error").remove();

        const token = $form.find("input[name='token']").val().trim();
        const password = $form.find("input[name='password']").val().trim();
        const password_confirmation = $form
            .find("input[name='password_confirmation']")
            .val()
            .trim();

        $submitBtn.prop("disabled", true).text("Resetting...");

        $.ajax({
            url: "/reset-password",
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                "X-Requested-With": "XMLHttpRequest",
            },
            data: {
                token,
                password,
                password_confirmation,
            },
            success: function (res) {
                $form[0].reset();
                showGlobalMessage(
                    res.message || "Password reset successfully.",
                    "green"
                );

                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            },
            error: function (xhr) {
                const res = xhr.responseJSON;

                // Show token error globally
                if (res?.errors?.token) {
                    showGlobalMessage(res.errors.token[0], "red");
                }

                // Show other field-specific errors
                $.each(res?.errors || {}, function (field, messages) {
                    if (field === "token") return; // already shown above

                    const $input = $form.find(`[name="${field}"]`);
                    const $group = $input.closest(".input-wrap");

                    if ($group.length) {
                        const $error = $(
                            '<div class="field-error text-sm mt-1" style="color:red;"></div>'
                        ).text(messages[0]);
                        $group.append($error);
                    }
                });

                // Optional: show fallback message
                if (!res?.errors && res?.message) {
                    showGlobalMessage(res.message, "red");
                }
            },
            complete: function () {
                $submitBtn.prop("disabled", false).text("Reset Password");

                setTimeout(() => {
                    $form.find(".field-error").fadeOut(300, function () {
                        $(this).remove();
                    });
                }, 4000);
            },
        });
    });

    function showGlobalMessage(msg, color = "green") {
        const alert = $(
            `<div class="text-center text-sm mb-3" style="color:${
                color === "green" ? "green" : "red"
            }">${msg}</div>`
        );
        $(".reset-pass").append(alert);
        setTimeout(() => alert.fadeOut(300, () => alert.remove()), 3000);
    }
});

//stories-loadmore
document.addEventListener("DOMContentLoaded", function () {
    // --- Force HTTPS if in production ---
    function forceHttps(url) {
        const isProd =
            document
                .querySelector('meta[name="app-env"]')
                ?.getAttribute("content") === "production";
        return isProd && url.startsWith("http:")
            ? url.replace(/^http:/, "https:")
            : url;
    }

    // --- Category Filter Redirect ---
    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) {
        categoryFilter.addEventListener("change", function () {
            const selectedCategory = this.value;
            const currentUrl =
                document
                    .querySelector('meta[name="current-url"]')
                    ?.getAttribute("content") || "/";

            window.location.href =
                selectedCategory === "all"
                    ? currentUrl
                    : `?category=${selectedCategory}`;
        });
    }

    // --- Load More Handler ---
    const wrapper = document.getElementById("stories-wrapper");
    if (wrapper) {
        wrapper.addEventListener("click", function (e) {
            const btn = e.target.closest(".load-more-btns");
            if (!btn) return;

            e.preventDefault();
            let url = btn.dataset.url;
            if (!url) return;

            url = forceHttps(url);

            const loadText = btn.querySelector(".load-text");
            const spinner = btn.querySelector(".spinner");

            if (loadText) loadText.textContent = "Loading...";
           if (spinner) spinner.style.display = "block";

            fetch(url)
                .then((res) => res.text())
                .then((html) => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");

                    const newEntries = doc.querySelectorAll(".story-block");
                    const loadMoreWrapper =
                        document.getElementById("load-more-wrapper");

                    newEntries.forEach((entry) => {
                        loadMoreWrapper?.before(entry);
                    });

                    const newLoadMore = doc.querySelector("#load-more-wrapper");
                    if (newLoadMore) {
                        loadMoreWrapper.innerHTML = newLoadMore.innerHTML;

                        const newUrl =
                            newLoadMore.querySelector(".load-more-btns")
                                ?.dataset.url;
                        if (newUrl) {
                            loadMoreWrapper
                                .querySelector(".load-more-btns")
                                .setAttribute("data-url", forceHttps(newUrl));
                        }
                    } else {
                        loadMoreWrapper?.remove();
                    }
                })
                .catch((err) => {
                    if (loadText) loadText.textContent = "Load more";
                    if (spinner) spinner.style.display = "none";
                });
        });
    }
});

//news-loadmore
document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (e) {
        const button = e.target.closest(".load-more-btn");
        if (!button) return;

        e.preventDefault();

        let url = button.getAttribute("data-url");
        if (!url) return;

        const isProduction =
            document
                .querySelector('meta[name="app-env"]')
                ?.getAttribute("content") === "production";
        if (isProduction && url.startsWith("http:")) {
            url = url.replace(/^http:/, "https:");
        }

        const text = button.querySelector(".load-text");
        const spinner = button.querySelector(".spinner");

        // Show loading state
        if (text) text.textContent = "Loading...";
        if (spinner) spinner.style.display = "block";

        fetch(url)
            .then((res) => res.text())
            .then((html) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const newItems = doc.querySelectorAll(".story-block");
                const nextButton = doc.querySelector(".load-more-btn");

                const container = document.querySelector(
                    "#stories-wrapper .grid"
                );
                newItems.forEach((item) => container?.appendChild(item));

                if (nextButton && container) {
                    button.setAttribute(
                        "data-url",
                        nextButton.getAttribute("data-url")
                    );
                    if (text) text.textContent = "Load more news";
                    if (spinner) spinner.style.display = "none";
                } else {
                    button?.parentElement?.remove(); // Remove button if no more data
                }
            })
            .catch(() => {
                if (text) text.textContent = "Load more";
                if (spinner) spinner.style.display = "none";
            });
    });
});

// fundraiser-filter
// $(document).ready(function () {
//     if (!$("#fundraiser-filter-form").length) return;

//     function forceHttps(url) {
//         const isProduction =
//             document
//                 .querySelector('meta[name="app-env"]')
//                 ?.getAttribute("content") === "production";
//         if (isProduction && url?.startsWith("http:")) {
//             return url.replace(/^http:/, "https:");
//         }
//         return url;
//     }

//     function loadFundraisers(url = "/filter-fundraisers") {
//         url = forceHttps(url);
//         const formData = $("#fundraiser-filter-form").serialize();

//         const isPagination = url.includes("page=");

//         if (!isPagination) {
//             // Show centered loader in fundraiser area
//             $("#fundraiser-list").html(
//                 '<div class="fundraiser-loader"><div class="custom-spinner"></div></div>'
//             );
//         } else {
//             // Show loader at bottom only
//             $("#pagination-area").html(
//                 '<div class="section-loader"><div class="custom-spinner"></div></div>'
//             );
//         }

//         $.ajax({
//             url: url,
//             data: formData,
//             success: function (html) {
//                 const dom = $("<div>").html(html);
//                 const items = dom.find("#fundraiser-items").html();
//                 const pagination = dom.find("#pagination-wrapper").html();

//                 if (!items || items.trim() === "") {
//                     $("#fundraiser-list").html(
//                         '<p class="text-center py-10 text-red-500">No Campaigns Found</p>'
//                     );
//                     $("#pagination-area").html("");
//                 } else {
//                     $("#fundraiser-list").html(items); // Replace after load
//                     $("#pagination-area").html(pagination);
//                 }

//                 if (!isPagination) {
//                     $("html, body").animate(
//                         {
//                             scrollTop: $("#fundraiser-list").offset().top - 100,
//                         },
//                         400
//                     );
//                 }
//             },
//         });
//     }

//     // Initial load
//     loadFundraisers();

//     // Filter form submit
//     $("#fundraiser-filter-form").on("submit", function (e) {
//         e.preventDefault();
//         loadFundraisers();
//     });

//     // Filter dropdown change
//     $("#category, #sort").on("change", function () {
//         loadFundraisers();
//     });

//     // Live search
//     $('input[name="search"]').on("keyup", function () {
//         loadFundraisers();
//     });

//     // Pagination click
//     $(document).on("click", ".pagination a, .pagination-link", function (e) {
//         e.preventDefault();
//         const url = $(this).attr("href");
//         if (url) loadFundraisers(forceHttps(url));
//     });

//     // Reset filters
//     $("#reset-filters").on("click", function (e) {
//         e.preventDefault();
//         $("#fundraiser-filter-form")[0].reset();
//         $('input[name="search"]').val("");
//         $("#category").val("");
//         $("#sort").val("");
//         loadFundraisers();
//     });
// });

// payment page
function getCookie(name) {
    const match = document.cookie.match(
        new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : null;
}

document.addEventListener("DOMContentLoaded", function () {
    // Only run if both required elements exist
    const descWrapper = document.getElementById("pay_type_descriptions");
    const output = document.getElementById("type_descriptions");

    if (!descWrapper || !output) {
        // Exit silently if this isn't the donation page
        return;
    }

    const fundingType = getCookie("pay_type"); // e.g., "Monthly Funding"
    const descContainer = descWrapper.querySelector(
        '[data-type="' + fundingType + '"]'
    );

    if (fundingType && descContainer) {
        output.innerHTML = descContainer.innerHTML;
    } else {
        output.innerHTML =
            "<p class='text-gray-500'>Please choose a donation type.</p>";
    }
});
$(window).on("load", function () {
    // Hide loader
    $("#donation-page-loader").fadeOut(300, function () {
        $(this).remove();
    });

    // Show content
    $("#donation-wrapper").fadeIn(300);
});
