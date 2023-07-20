const { comparePassword } = require('../helpers/bycrpt')
const { signToken } = require('../helpers/jwt')
const { Comment, Event, Post, Sticker, User, UserEvent } = require('../models/index')
const axios = require('axios')
const midtransClient = require('midtrans-client')
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = '534631628528-qpbac73cdeg6hjc1n4g2u288jqdk5tu0.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
class Controller {

    //========== REGISTER & LOGIN ============

    static async register(req, res) {
        try {
            const { email, userName, password } = req.body

            if (!userName) throw { name: 'NoUserName' }
            if (!email) throw { name: 'NoEmail' }
            if (!password) throw { name: 'NoPassword' }

            const user = await User.create({ email, userName, password })

            res.status(200).json({
                id: user.id,
                userName: user.userName,
                email: user.email,
                password: user.password,
                profilePicture: user.imageUrl,
                subscribe: user.subs
            })

        } catch (error) {
            if (error.name === 'NoEmail') {
                res.status(400).json({
                    "message": "Email is required"
                })
            } else if (error.name === 'NoUserName') {
                res.status(400).json({
                    "message": "User Name is required"
                })
            } else if (error.name === 'NoPassword') {
                res.status(400).json({
                    "message": "Password is required"
                })
            } else {
                console.log(error);
                res.status(500).json({
                    "message": "Internal server error"
                })
            }

        }
    }

    static async loginGoogle(req, res, next) {
        const { id_token } = await req.body;
        try {
            const ticket = await client.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            const googleId = payload['sub'];
            const email = payload['email'];
            let user = await User.findOne({ where: { email } });
            if (!user) {
                user = await User.create({
                    userName : 'google',
                    email,
                    password: googleId
                    // phoneNumber: 'Google',
                    // addres: 'Google'
                });
            }
            const token = signToken({
                id: user.id,
                userName: user.userName,
                email: user.email,
                imageUrl: user.imageUrl,
                subs: user.subs
            });
            res.status(200).json({
                "message": "Login Successful",
                access_token: token
            })
            
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body
            if (!email) throw { name: 'NoEmail' }
            if (!password) throw { name: 'NoPassword' }

            const user = await User.findOne({ where: { email } })

            if (!user) throw { name: 'UserNotFound' }
            const isPasswordValid = comparePassword(password, user.password)
            if (!isPasswordValid) throw { name: 'PasswordInvalid' }

            const token = signToken({
                id: user.id,
                userName: user.userName,
                email: user.email,
                imageUrl: user.imageUrl,
                subs: user.subs
            })

            res.status(200).json({
                "message": "Login Successful",
                access_token: token
            })
        } catch (error) {
            if (error.name === 'NoEmail') {
                res.status(400).json({
                    "message": "Email is required"
                })
            } else if (error.name === 'NoPassword') {
                res.status(400).json({
                    "message": "Password is required"
                })
            } else if (error.name === 'UserNotFound') {
                res.status(404).json({
                    "message": "User not found"
                })
            } else if (error.name === 'PasswordInvalid') {
                res.status(401).json({
                    "message": "Invalid password"
                })
            } else {
                console.log(error);
                res.status(500).json({
                    "message": "Internal server error"
                })
            }
        }
    }

    //========== POST ============

    static async getAllPost(req, res) {
        try {
            const posts = await Post.findAll()

            res.status(200).json({
                posts
            })

        } catch (error) {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    static async getPost(req, res) {
        try {
            const post = await Post.findByPk(req.params.id)
            if (post) {
                res.status(200).json({
                    post
                })
            } else {
                res.status(404).json({
                    "message": "Post not found"
                })
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    static async addPost(req, res) {
        try {
            const { title, content } = req.body
            const { id } = req.loggedInUser

            if (!title) throw { name: 'NoTitle' }
            if (!content) throw { name: 'NoContent' }

            const post = await Post.create({ title, content, UserId: id })
            console.log(post);

            res.status(201).json({
                id: post.id,
                title: post.title,
                content: post.content,
                UserId: post.userId
            })
        } catch (error) {
            if (error.name === 'NoTitle') {
                res.status(400).json({
                    "message": "Title is required"
                })
            } else if (error.name === 'NoContent') {
                res.status(400).json({
                    "message": "Content is required"
                })
            } else {
                console.log(error);
                res.status(500).json({
                    "message": "Internal server error"
                })
            }
        }
    }

    static async deletePost(req, res) {
        try {
            const post = await Post.findByPk(req.params.id)

            if (!post) {
                return res.status(404).json({
                    "message": "Post not found"
                })
            }

            if (post.UserId !== req.loggedInUser.id) {
                return res.status(403).json({
                    "message": "You are not authorized to delete this post"
                })
            }

            await post.destroy()

            return res.status(200).json({
                "message": "Post deleted successfully"
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    static async editPost(req, res) {
        try {
            const { title, content } = req.body
            const post = await Post.findByPk(req.params.id)

            if (!post) {
                return res.status(404).json({
                    "message": "Post not found"
                })
            }

            if (post.UserId !== req.loggedInUser.id) {
                return res.status(403).json({
                    "message": "You are not authorized to edit this post"
                })
            }

            await post.update({ title, content })

            return res.status(200).json({
                "message": "Post updated successfully",
                post
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    //========== USER ============

    static async getUser(req, res) {
        try {
            const { id } = req.loggedInUser

            const user = await User.findByPk(id)

            if (!user) {
                return res.status(404).json({
                    "message": "User not found"
                })
            }

            res.status(200).json({
                id: user.id,
                userName: user.userName,
                email: user.email,
                imageUrl: user.imageUrl,
                subs: user.subs
            })

        } catch (error) {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    static async editUser(req, res) {
        try {
            const { userName } = req.body
            const { id } = req.loggedInUser

            const userToUpdate = await User.findByPk(id)

            if (!userToUpdate) {
                return res.status(404).json({
                    "message": "User not found"
                })
            }

            const imageUrl = req.file
                ? req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename
                : req.body.imageUrl
                    ? req.body.imageUrl
                    : userToUpdate.imageUrl;

            const updatedUser = await userToUpdate.update({
                userName,
                imageUrl
            })



            res.status(200).json({
                id: updatedUser.id,
                userName: updatedUser.userName,
                email: updatedUser.email,
                imageUrl: updatedUser.imageUrl,
                subs: updatedUser.subs
            })

        } catch (error) {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    static async getMitransToken(req, res) {
        try {
            const { id } = req.loggedInUser
            const user = User.findByPk(id)

            if (user.subs) throw { name: "AlreadySubs" }


            let snap = new midtransClient.Snap({
                // Set to true if you want Production Environment (accept real transaction).
                isProduction: false,
                serverKey: 'SB-Mid-server-m7_hl_I4W3IWSZnPbDzv_reP'
            });

            let parameter = {
                "transaction_details": {
                    "order_id": "YOUR-ORDERID-" + Math.floor(1000000 + Math.random() * 9000000),
                    "gross_amount": 150000
                },
                "credit_card": {
                    "secure": true
                },
                "customer_details": {
                    // "first_name": "budi"
                    // "last_name": "pratama",
                    "email": user.email,
                    // "phone": "08111222333"
                }
            };

            const midtrans = await snap.createTransaction(parameter)

            res.status(201).json({
                midtrans
            })

        } catch (error) {
            if (error.name === "AlreadySubs") {
                res.status(401).json({
                    "message": "Already Subscribe "
                })
            }
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    static async updateSubsStatus(req, res) {
        try {
            const { id } = req.loggedInUser;
            console.log(id, "========================");
            // Find the user
            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    "message": "User not found"
                });
            }

            user.subs = true;
            // await user.update({ subs: true })
            // const updatedUser = await user.save();
            await user.save()

            res.status(200).json({
                id: user.id,
                userName: user.userName,
                email: user.email,
                imageUrl: user.imageUrl,
                subs: user.subs
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            });
        }
    }

    //========== COMMENT ============

    static async getCommentsForPost(req, res) {
        try {
            const PostId = req.params.id;

            const post = await Post.findByPk(PostId)

            if (!post) {
                return res.status(404).json({
                    "message": "Post not found"
                })
            }

            const comments = await Comment.findAll({
                where: {
                    PostId: PostId
                },
                include: [User]
            });

            if (comments.length === 0) {
                return res.status(404).json({
                    "message": "No comments found for this post"
                })
            }

            res.status(200).json(comments);
        } catch (error) {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            });
        }
    }

    static async addComment(req, res) {
        try {
            const { content, StickerId = null } = req.body;
            const { id, subs } = req.loggedInUser;
            const PostId = req.params.id;

            if (!content) throw { name: 'NoContent' }

            if (StickerId && !subs) throw { name: 'NotSubscribed' }

            const newComment = await Comment.create({
                UserId: id,
                PostId: PostId,
                content: content,
                StickerId: subs ? StickerId : null
            });

            res.status(201).json({
                id: newComment.id,
                UserId: newComment.UserId,
                PostId: newComment.PostId,
                content: newComment.content,
                StickerId: newComment.StickerId
            })

        } catch (error) {
            if (error.name === 'NoContent') {
                res.status(400).json({
                    "message": "Content is required"
                })
            } else if (error.name === 'NotSubscribed') {
                res.status(403).json({
                    "message": "Only subscribed users can send stickers"
                })
            } else {
                console.log(error);
                res.status(500).json({
                    "message": "Internal server error"
                })
            }
        }
    }

    static async editComment(req, res) {
        try {
            const { postId, commentId } = req.params;
            const { content, StickerId = null } = req.body;
            const { id, subs } = req.loggedInUser;

            const comment = await Comment.findOne({ where: { id: commentId, PostId: postId } });

            if (!comment) {
                return res.status(404).json({
                    "message": "Comment not found"
                })
            }

            if (comment.UserId !== id) {
                return res.status(403).json({
                    "message": "You are not authorized to edit this comment"
                })
            }

            if (StickerId && !subs) throw { name: 'NotSubscribed' }

            await comment.update({ content, StickerId: subs ? StickerId : null });

            return res.status(200).json({
                "message": "Comment updated successfully",
                comment
            })
        } catch (error) {
            if (error.name === 'NotSubscribed') {
                return res.status(403).json({
                    "message": "Only subscribed users can edit stickers"
                })
            } else {
                console.log(error);
                return res.status(500).json({
                    "message": "Internal server error"
                })
            }
        }
    }

    static async deleteComment(req, res) {
        try {
            const { postId, commentId } = req.params;

            const comment = await Comment.findOne({ where: { id: commentId, PostId: postId } });

            if (!comment) {
                return res.status(404).json({
                    "message": "Comment not found"
                })
            }

            const post = await Post.findOne({ where: { id: postId } });

            if (!post) {
                return res.status(404).json({
                    "message": "Post not found"
                })
            }

            if (comment.UserId !== req.loggedInUser.id && post.UserId !== req.loggedInUser.id) {
                return res.status(403).json({
                    "message": "You are not authorized to delete this comment"
                })
            }

            await comment.destroy();

            return res.status(200).json({
                "message": "Comment deleted successfully"
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                "message": "Internal server error"
            })
        }
    }

    ///========== MEME ============

    static async getMemes(req, res) {
        try {
            const response = await axios.get('https://api.imgflip.com/get_memes');

            if (response.data.success) {
                const memes = response.data.data.memes;
                res.status(200).json({ success: true, data: memes });
            } else {
                res.status(400).json({ success: false, message: 'Gagal mengambil memes' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    static async fetchAndSaveStickers(req, res) {
        try {
            const response = await axios.get('https://api.imgflip.com/get_memes');
            const stickersData = response.data.data.memes;

            console.log(stickersData);

            // Memproses data sticker yang diperoleh
            const stickers = stickersData.map(stickerData => ({
                title: stickerData.name,
                imageUrl: stickerData.url,
            }));

            // Menyimpan stickers ke dalam tabel Sticker
            await Sticker.bulkCreate(stickers);

            res.status(200).json({ message: 'Data stickers berhasil diambil dan disimpan.' });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengambil atau menyimpan data stickers:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengambil atau menyimpan data stickers.' });
        }
    }

    //========== EVENT ============

    static async viewEvents(req, res) {
        try {
            const events = await Event.findAll({
                include: [User]
            });

            res.status(200).json(events);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async createEvent(req, res) {
        try {
            const { subs } = req.loggedInUser;
            if (!subs) {
                return res.status(403).json({ message: "Only Subcription User can create Event" });
            }

            const { title, description, date } = req.body;
            if (!title || !description || !date) {
                return res.status(400).json({ message: "All field is required" });
            }

            const newEvent = await Event.create({
                title,
                description,
                date,
                OrganizerId: req.loggedInUser.id
            });

            res.status(201).json(newEvent);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    // T
    static async viewEventDetails(req, res) {
        try {
            const eventId = req.params.eventId;
            const event = await Event.findOne({
                where: { id: eventId },
                include: [User]
            });

            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            res.status(200).json(event);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async editEvent(req, res) {
        try {
            const eventId = req.params.eventId;
            const { title, description, date } = req.body;

            const event = await Event.findOne({ where: { id: eventId } });
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            if (event.OrganizerId !== req.loggedInUser.id) {
                return res.status(403).json({ message: "Only the organizer can edit the event" });
            }

            await Event.update({ title, description, date }, { where: { id: eventId } });

            res.status(200).json({ message: "Event updated successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async deleteEvent(req, res) {
        try {
            const eventId = req.params.eventId;

            const event = await Event.findOne({ where: { id: eventId } });
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            if (event.OrganizerId !== req.loggedInUser.id) {
                return res.status(403).json({ message: "Only the organizer can delete the event" });
            }

            await Event.destroy({ where: { id: eventId } });

            res.status(200).json({ message: "Event deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async addParticipant(req, res) {
        try {
            const eventId = req.params.eventId;
            const userId = req.loggedInUser.id;

            const event = await Event.findOne({ where: { id: eventId } });
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            const isAlreadyParticipant = await UserEvent.findOne({ where: { EventId: eventId, UserId: userId } });
            if (isAlreadyParticipant) {
                return res.status(400).json({ message: "You are already a participant in this event" });
            }

            await UserEvent.create({
                EventId: eventId,
                UserId: userId
            });

            res.status(201).json({ message: "Successfully joined the event" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async removeParticipant(req, res) {
        try {
            const eventId = req.params.eventId;
            const participantId = req.params.participantId;

            const event = await Event.findOne({ where: { id: eventId } });
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            if (event.OrganizerId === req.loggedInUser.id || participantId == req.loggedInUser.id) {
                await UserEvent.destroy({ where: { EventId: eventId, UserId: participantId } });
                res.status(200).json({ message: "Participant removed successfully" });
            } else {
                return res.status(403).json({ message: "You are not allowed to remove participant" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }


}

module.exports = Controller