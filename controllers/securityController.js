// Signup
exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const { name, mobile, password, email, aadharNumber, address } = req.body;

        // Check if user exists
        const existingUser = await SecurityUser.findOne({ mobile });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: 'User already exists'
                }
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store temporary data in memory (or Redis in production)
        const tempUserData = {
            name,
            mobile,
            password,
            email,
            aadharNumber,
            address,
            otp,
            otpExpiry,
            profilePicture: req.file ? req.file.filename : undefined
        };

        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${mobile}: ${otp}`);
        }

        res.status(201).json({
            success: true,
            message: 'OTP sent successfully. Please verify your mobile number.',
            data: {
                mobile,
                tempId: Date.now().toString() // Temporary ID for reference
            }
        });
    } catch (error) {
        next(error);
    }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const { mobile, otp, name, password, email, aadharNumber, address } = req.body;

        // Verify OTP
        if (otp !== tempUserData.otp) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OTP',
                    message: 'Invalid OTP'
                }
            });
        }

        if (tempUserData.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'OTP_EXPIRED',
                    message: 'OTP has expired'
                }
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user in database
        const user = new SecurityUser({
            name,
            mobile,
            password: hashedPassword,
            email,
            aadharNumber,
            address,
            isVerified: true,
            profilePicture: tempUserData.profilePicture
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Mobile number verified and account created successfully',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    aadharNumber: user.aadharNumber,
                    address: user.address,
                    isVerified: true,
                    role: 'security'
                }
            }
        });
    } catch (error) {
        next(error);
    }
}; 